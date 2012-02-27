/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */


var redis = require("redis")
  , consts = require("./consts")
  , Logger = require('./logger')
  , Router = require("./router.js")
  , utils = require("./utils")
  , http = require('http')
  , fs = require('fs')
  , ClientsPool = require("./clients_pool")
  , HornetClient = require("./hornet_client")
  , HornetRequest = require("./hornet_request")
  , ChannelsHub = require("./channels_hub");

var defaultRoutes = require('./routes');


/**
 * Start the Hornet server instance (with socket.io)
 */
var listen = function( options ) {
  var hornet = new Hornet( options ); 
  hornet.listen();

  return hornet;
};


function Hornet( options ) {
  var that = this;

  var defaults = {
    "log_level" : 4,
    "socketio_log_level" : 0,
    "socketio_origins" : '*:*',
    "port" : consts[ 'SERVER_PORT' ],
    "routes" : defaultRoutes
  };

  this.settings = utils.extend( defaults, options );

  this.logger = new Logger( this.settings['log_level'] );
  this.router = new Router( this.logger );

  var routes = this.settings['routes'];

  // instianciate all routes
  for ( var path in routes ) {
    var route = routes[path]
    this.router.set(path, route['id'], route['handler'] );
  }


  // redis client
  this.redis = redis.createClient();

  this.redis.on("error", function (err) {
    that.logger.log("Something went wrong when trying to connect to Redis" + err , module);
  });


  this.clientsPool = new ClientsPool( { logger: that.logger } );

  this.channelsHub = new ChannelsHub( this.settings );
};

Hornet.prototype = {
  close : function() {
    this.server.close();
  },

  connectConfirmation : function( socket, token ) {
    var msg = { 
      type: consts['TYPE_CONNECTED'],
      channel: consts['HORNET_CHANNEL'],
      msg: consts['INFO_CONNECTED'], 
    };

    socket.send( JSON.stringify( msg ) );
  },

  /**
   * disconnect a socket, reason is token is not valid
   */
  disconnectInvalidToken : function( socket, token) {
    var msg = { 
      type: consts['TYPE_ERROR_MESSAGE'],
      channel: consts['HORNET_CHANNEL'],
      error: consts['ERROR_INVALID_TOKEN'], 
      errorMsg : "Invalid token used, please get a new token" 
    };

    socket.send( JSON.stringify( msg ) );

    // TODO : maybe we should consider logging more data about the client here...
    this.logger.log("A client tried to connect with an unregistred token:'" + token + "'", module);
  },

  /**
   * disconnect a socket, reason is the token is not associated correctly to a channel
   */
  disconnectInvalidTokenForChannel : function( socket, token, channel ) {
    var msg = {
      type: consts['TYPE_ERROR_MESSAGE'],
      channel: consts['HORNET_CHANNEL'],
      error: consts['ERROR_WRONG_TOKEN_ASSOCIATION'],
      errorMsg : "Token is not associated to one of the requested channel"
    };

    socket.send( JSON.stringify(msg) );

    // TODO : maybe we should consider logging more data about the client here...
    this.logger.log('Client connection error: token:"' + token + '" not associated to channel:' + channel );
  },

  /**
   * disconnect a socket, reason is the message does not have the right format
   */
  disconnectWrongMessageFormat : function( socket ) {
    this.logger.log('Connection error: wrong parameters: channel and/or token were missing', module);

    var msg = {
      type: consts['TYPE_ERROR_MESSAGE'],
      channel: consts['HORNET_CHANNEL'],
      error: consts['ERROR_WRONG_PARAMETERS'], 
      errorMsg: "Client connection error: Wrong parameters. You should connect to hornet with channels and token parameters" 
    };

    socket.send( JSON.stringify( msg ));
  },
   

  /**
   * fire an event
   */
  fire : function( eventName ) {
    if ( ! this.events || ! this.events[ eventName ] )
      return;


    this.logger.log("Firing : " + eventName, module );
    
    for ( var i in this.events[ eventName ] ) {
      var callback = this.events[ eventName ][i];

      callback();
    }
  },


  /**
   * Handles a new realtime connection to hornet. 
   * Hornet checks at this point if the client can access the desired channel using the given token
   */
  handleConnection : function( socket, rawMessage ) {  
    var that = this;

    var message;
    
    try {
      message = JSON.parse( rawMessage ); 
    }
    catch(e) {
      this.disconnectWrongMessageFormat( socket );
      return;
    }
    
    if ( ! ( "channels" in message ) && ! ( "token" in message ) ) {
      this.disconnectWrongMessageFormat( socket );
      return;
    }

    var token = message.token
      , channels = message.channels;

    /**
     * 1 - We need to check that the token is valid (exists in Redis)
     */
    that.redis.exists("hornet:token:" + token, function(err, exists) {
      if ( exists != 1 ) {
        that.disconnectInvalidToken( socket, token );
        return;
      }
    
      /**
       * 2 - We check that each requested channel is associated to the token
       * User can subscribe only if all channel are in redis.
       * Otherwise it means that something, somewhere has either been coded in a bad maneer or has been modified.
       */
      that.redis.smembers('hornet:token:' + token,  function(err, reply) {
        // https://gist.github.com/1364034
        var channelsIndex = {}
          , found = true
          , wrongChannel = '';

        for ( var i in reply ) {
          channelsIndex[ reply[i] ] = i;   
        }

        for ( var i in channels ) {
          var channel = channels[i];

          if ( ! ( channel in channelsIndex ) )  {
            found = false;
            wrongChannel = channel;
            break;
          }
        }

        if ( found ) {
          var client = that.clientsPool.get( token, socket );

          for ( var i in channels ) {
            var channel = channels[ i ];

            that.logger.log('Access granted for token:' + token + ' on channel:' + channel + '. Starting connected mode.', module);
          
            that.channelsHub.subscribe( channel, client );  
          }

          that.connectConfirmation( socket, token );

          // we delete the token after the client has successfully subscribed to each channel
          that.redis.del('hornet:token:' + token );
        }
        else {
          that.disconnectInvalidTokenForChannel( socket, token, channel );
          return;
        }
      });
    });
  },

  /**
   * starts http and socket io servers
   */
  listen : function() {
    var that = this;
    this.logger.log('Starting Hornet Server v' + consts['HORNET_VERSION'] + ' on port: ' + this.settings['port'] , module);

    // classic http server
    this.server = http.createServer( function( req, res) {
      that.logger.log("New request", module);
      that.router.serve( req, res );
    });

    this.server.listen( this.settings['port'] );

      
    // socket io
    var socketIo = require('socket.io');

    this.io = socketIo.listen( this.server , { 
      'log level' : this.settings['socketio_log_level'],
      'origins': this.settings['socketio_origins']
    });

    this.io.sockets.on('connection', function ( client ) {
      that.logger.log('New client connection - ' + JSON.stringify( client['handshake']['address'] ) + " - " + JSON.stringify( client['handshake']['headers'] ) , module);

      for (var  i in client ) {
        //that.logger.log(" i:" + i + " - "  );
//
        //if ( i == "handshake") {
        //  for ( var j in client[i] ) {
        //    that.logger.log("j:" + j);
        //  }
        //}
      }

      client.on('message', function ( message )  {
        that.handleConnection( this, message );
      });
    });


    this.logger.log('Hornet Server started, listening any connections...', module);

    this.fire('ready');
  },

  /**
   * binds a callback on a particular event
   */
  on : function( eventName , callback ) {
    if ( ! this.events )
      this.events = {};

    if ( ! this.events[ eventName ] )
      this.events[ eventName ] = [];
    
    this.events[ eventName ].push( callback );
  }
}

/**
 * Export the constructor.
 */
exports = module.exports = Hornet;