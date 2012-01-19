/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */


require('./hornet_request.js');
require('./hornet_client.js');

var redis = require("redis")
  , consts = require("./consts")
  , Logger = require('./logger')
  , Router = require("./router.js")
  , utils = require("./utils")
  , http = require('http')
  , fs = require('fs')
  , clientsPool = require("./clients_pool")
  , channelsHub = require("./channels_hub");

var defaultRoutes = require('./routes');

/**
 * The redis client
 * TODO : move this into one dedicated file
 */
var redisClient = redis.createClient();

redisClient.on("error", function (err) {
  utils.log("Something went wrong when trying to connect to Redis" + err , module);
});


/**
 * Handles a new realtime connection to hornet. 
 * Hornet checks at this point if the client can access the desired channel using the given token
 */
var handleConnection = function( rawMessage ) {  
  var message = JSON.parse( rawMessage );
  var socket = this;
  
  if ( ! ( "channels" in message ) && ! ( "token" in message ) ) {
    utils.log('Connection error: wrong parameters: channel and/or token were missing', module);

    var msg = {
      type: consts['TYPE_ERROR_MESSAGE'],
      channel: consts['HORNET_CHANNEL'],
      error: consts['ERROR_WRONG_PARAMETERS'], 
      errorMsg: "Client connection error: Wrong parameters. You should connect to hornet with channels and token parameters" 
    };

    socket.send( JSON.stringify( msg ));
  }

  var token = message.token,
    channels = message.channels;

  /**
   * 1 - We need to check that the token is valid (exists in Redis)
   */
  redisClient.exists("hornet:token:" + token, function(err, reply) {
    var exists = reply;

    if ( exists != 1 ) {
      var msg = { 
        type: consts['TYPE_ERROR_MESSAGE'],
        channel: consts['HORNET_CHANNEL'],
        error: consts['ERROR_INVALID_TOKEN'], 
        errorMsg : "Invalid token used, please get a new token" 
      };

      socket.send(JSON.stringify( msg ));

      // TODO : maybe we should consider logging more data about the client here...
      utils.log("A client tried to connect with an unregistred token:'" + token + "'", module);

      return;
    }
  
    /**
     * 2 - We check that each requested channel is associated to the token
     * User can subscribe only if all channel are in redis.
     * Otherwise it means that something, somewhere has either been coded in a bad maneer or has been modified.
     */
    redisClient.smembers('hornet:token:' + token,  function(err, reply) {
      // https://gist.github.com/1364034
      var compare = {};
      var found = true;
      var wrongChannel = '';

      for ( var i in reply ) {
        compare[reply[i]] = reply[i];   
      }

      for ( var i in channels ) {
        if ( ! ( channels[i] in compare ) )  {
          found = false;
          wrongChannel = channels[i];
          break;
        }
      }

      if ( found ) {
        var client = clientsPool.get(token, socket);

        for ( var i in channels ) {
          var channel = channels[i];

          utils.log('Access granted for token:' + token + ' on channel:' + channel + '. Starting connected mode', module);
        
          channelsHub.subscribe( channel, client );  
        }

        // we delete the token after the client has successfully subscribed to each channel
        redisClient.del('hornet:token:' + token );
      }
      else {
        var msg = {
          type: consts['TYPE_ERROR_MESSAGE'],
          channel: consts['HORNET_CHANNEL'],
          error: consts['ERROR_WRONG_TOKEN_ASSOCIATION'],
          errorMsg : "Token is not associated to one of the requested channel"
        };

        socket.send( JSON.stringify(msg) );

        // TODO : maybe we should consider logging more data about the client here...
        utils.log('Client connection error: token:"' + token + '" not associated to channel:' + wrongChannel );

        return;
      }
    });
  });
};

/**
 * Start the Hornet server instance (with socket.io)
 */
var listen = function( options ) {
  var hornet = new Hornet( options ); 
  hornet.listen();

  return hornet;
};


function Hornet( options ) {
  var defaults = {
    "log_level" : 4,
    "socketio_log_level" : 1,
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
  };
};

Hornet.prototype = {
  close : function() {
    this.server.close();
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

    this.io = socketIo.listen( this.server , { 'log level' : this.settings['socketio_log_level'] });

    this.io.sockets.on('connection', function ( client ) {
      this.logger.log('New connection', module);

      client.on('message', handleConnection);
    });


    this.logger.log('Hornet Server started, waiting for connections...', module);

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