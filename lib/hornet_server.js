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

  if ( ! message.channel && ! message.hornetToken ) {
    utils.log('Connection error : wrong parameters, channel and/or hornetToken were missing', module);
    socket.send("Client connection error: Wrong parameters. You should connect to hornet specifying channel and hornetToken parameters");
  }

  var token = message.token,
    channel = message.channel;

  redisClient.exists("hornet:token:" + token, function(err, reply) {

    var exists = reply;

    if (exists != 1) {
      socket.send("Connection error : invalid token");

      // TODO : maybe we should consider logging more data about the client here...
      utils.log('Client connection error: Unregistred token detected : ' + token );

      return;
    }
	
    redisClient.get('hornet:token:' + token,  function(err, reply) {
      if (reply == channel) {
        utils.log('Access granted for token:' + token + ' on channel:' + channel + '. Starting connected mode', module);
		    
        var client = hornetClientsPool.get(token, socket);
		    hornetChannelsHub.subscribe( channel, client );
      }
      else {    
        socket.send("Connection error : unauthorized access");

        // TODO : maybe we should consider logging more data about the client here...
        utils.log('Client connection error: token:' + token + ' not associated to channel:' + channel);

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
