require('./hornet_request.js');
require('./hornet_client.js');
require('./hornet_const.js');

var redis = require("redis"),
  utils = require("./utils"),
  http = require('http'),
  router = require("./hornet_server_router.js"),
  fs = require('fs'),
  hornetClientsPool = require("./hornet_clients_pool.js"),
  hornetChannelsHub = require("./hornet_channels_hub");


require('./hornet_server_routes.js');

var redisClient = redis.createClient();

redisClient.on("error", function (err) {
  utils.log("Error connecting client" + err , module);
});


/**
 * Handles a new realtime connection to hornet. 
 * Hornet checks at this point if the client can access the desired channel using the given token
 */
var handleConnection = function( rawMessage ) {  
  var message = JSON.parse( rawMessage );
  var socket = this;
  
  if ( ! message.channels && ! message.token ) {
    utils.log('Connection error : wrong parameters, channel and/or hornetToken were missing', module);

    var msg = {
      type: "error",
      channel: "hornet",
      error: "WRONG_PARAMETERS", 
      errorMsg: "Client connection error: Wrong parameters. You should connect to hornet specifying channel and hornetToken parameters" 
    };

    socket.send( JSON.stringify( msg ));
  }

  var token = message.token,
    channels = message.channels;

  // utils.log("About to validate token:" + token + " for channel:" + channels, module );

  redisClient.exists("hornet:token:" + token, function(err, reply) {

    var exists = reply;

    if (exists != 1) {
      var msg = { 
        type: "error",
        channel: "hornet",
        error: "INVALID_TOKEN", 
        errorMsg : "Invalid token used, please get a new token" 
      };

      socket.send(JSON.stringify( msg ));

      // TODO : maybe we should consider logging more data about the client here...
      utils.log('Client connection error: Unregistred token detected : ' + token, module);

      return;
    }
  
    redisClient.smembers('hornet:token:' + token,  function(err, reply) {
      // https://gist.github.com/1364034
      var compare = {};
      var found = true;
      var wrongChannel = '';

      for ( var i in reply ) {
        compare[reply[i]] = reply[i];   
      }

      for ( var i in channels ) {
        if ( ! ( channels[i] in compare ) ) {
          found = false;
          wrongChannel = channels[i];
          break;
        }
      }

      // User can subscribe only if all channel are in redis
      if ( found ) {
        for ( var i in channels ) {
          var channel = channels[i];

          utils.log('Access granted for token:' + token + ' on channel:' + channel + '. Starting connected mode', module);
        
          var client = hornetClientsPool.get(token, socket);
          hornetChannelsHub.subscribe( channel, client );
          
        }
        redisClient.del('hornet:token:' + token );
      }
      else {

        var msg = {
          type: "error",
          channel: "hornet",
          error: "WRONG_TOKEN_ASSOCIATION",
          errorMsg : "Connection error : unauthorized access"
        };

        socket.send( JSON.stringify(msg) );

        // TODO : maybe we should consider logging more data about the client here...
        utils.log('Client connection error: token:' + token + ' not associated to channel:' + wrongChannel );

        return;
      }
    });
  });
};


var start = function() {
  server = http.createServer(router.serve);
  server.listen(SERVER_PORT);
  
  // socket.io 

  var io = require('socket.io').listen( server );
  io.sockets.on('connection', function ( client ) {
    utils.log('HornetServer - new connection');

    client.on('message', handleConnection);
  });
};


exports.set = router.set;
exports.start = start;
