/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require('./consts'),
  Logger = require('./logger'),
  utils = require('./utils'),
  HornetChannel = require('./hornet_channel.js'),
  redis = require('redis')

function ChannelsHub(settings) {
  var that = this

  this.settings = settings
  this.channels = {}
  this.logger = new Logger(this.settings['log_level'])

  // redis client
  this.redis = redis.createClient({
    url: process.env.REDIS_URI
  })

  this.redis.on('error', function(err) {
    that.logger.log(
      'Something went wrong when trying to connect to Redis' + err,
      module
    )
  })

  this.redis.on('subscribe', function(channel, count) {
    that.logger.log(
      'Subscribed to channel:' + channel + ' - connected subscribers:' + count,
      module
    )
  })

  /**
   * When a new message arrive, we broadcast it to the dedicated channel
   */
  this.redis.on('message', function(channel, message) {
    that.onMessage(channel, message)
  })
}

ChannelsHub.prototype = {
  onMessage: function(fullChannelName, message) {
    var channelNameX = fullChannelName.lastIndexOf(':') + 1,
      channelName = fullChannelName.substr(channelNameX),
      hornetChannel = this.channels[channelName],
      message = JSON.parse(message) // is this really necessary to parse it?

    if (!hornetChannel) return

    hornetChannel.broadcast(message)
  },

  /**
   * Subscribe a client to a specific channel
   * @exported
   */
  subscribe: function(channelName, client) {
    // if channel is not already instanciated, we create it and subscribe to it
    if (!(channelName in this.channels)) {
      this.channels[channelName] = new HornetChannel(this.settings, channelName)

      this.logger.log(
        'Channel:' + channelName + ' - subscribing token:' + client.token,
        module
      )

      this.redis.subscribe(
        consts['HORNET_USER_SPECIFIC_CHANNEL_PREFIX'] + channelName
      )
    }

    var channel = this.channels[channelName]

    channel.addClient(client)

    return channel
  }
}

/**
 * Export the constructor.
 */
exports = module.exports = ChannelsHub
