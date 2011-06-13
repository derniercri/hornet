require('./hornet_channel.js');

var utils = require('./utils.js'),
  redis = require("redis");

var channels = [];

var redisSubscriber = redis.createClient();

redisSubscriber.on("error", function (err) {
  utils.log("Redis connection error - can't subscribe : " + err, module);
});


redisSubscriber.on("subscribe", function (channel, count) {
  utils.log("Successfully subscribed on channel:" + channel + " count:" + count, module);
});


redisSubscriber.on("message", function ( hornetChannelName , message) {
  var channelName = hornetChannelName.substr( hornetChannelName.lastIndexOf(':') + 1 ),
    hornetChannel = channels[channelName],
    message = JSON.parse( message );
	
  if ( ! hornetChannel )
	  return;
    
  hornetChannel.broadcast(message);
});

var subscribe = function ( channelName , client ) {
  if ( channels[channelName] === undefined ) {  

    channels[channelName] = new HornetChannel(channelName);
    
    utils.log('Subscribing token:' + client.token + ' to channel:' + channelName );
    redisSubscriber.subscribe("hornet:channel:" + channelName );
  }
  
  var channel = channels[channelName];

  channel.addClient( client );

  return channel;
};

// TODO : set timer to unsubscribe empty channels
exports.subscribe = subscribe;