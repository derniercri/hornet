/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

require('./hornet_channel.js');

var consts = require('./consts')
  , utils = require('./utils')
  , redis = require("redis");

/**
 * Opened Channels list
 */
var channels = [];

/**
 * Default behaviors for message, error and subscription
 */
var redisSubscriber = redis.createClient();
redisSubscriber.on("error", function (err) {
  utils.log("Redis connection error - can't subscribe: " + err, module);
});

redisSubscriber.on("subscribe", function (channel, count) {
  utils.log("Subscribed to channel:" + channel + " - connected subscribers:" + count, module);
});

/**
 * When a new message arrive, we broadcast it to the dedicated channel
 */
redisSubscriber.on("message", function ( hornetChannelName , message) {
  var channelNameX = hornetChannelName.lastIndexOf(':') + 1; 
    channelName = hornetChannelName.substr( channelNameX ),
    hornetChannel = channels[channelName],
    message = JSON.parse( message ); // is this really necessary to parse it?
	
  if ( ! hornetChannel )
	  return;
    
  hornetChannel.broadcast(message);
});

/**
 * Subscribe a client to a specific channel
 * @exported
 */
var subscribe = function ( channelName , client ) {
  // if channel is not already instanciated, we create it and subscribe to it
  if ( ! ( channelName in channels ) ) {  

    channels[ channelName ] = new HornetChannel( channelName );
    
    utils.log('Channel:' + channelName + ' - subscribing token:' + client.token , module);

    redisSubscriber.subscribe( consts['HORNET_USER_SPECIFIC_CHANNEL_PREFIX'] + channelName );
  }
  
  var channel = channels[channelName];

  channel.addClient( client );

  return channel;
};

// TODO : set timer to unsubscribe empty channels
exports.subscribe = subscribe;