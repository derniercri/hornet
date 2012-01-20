/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require('./consts')
  , utils = require('./utils')
  , Logger = require('./logger')
  , redis = require('redis');

/**
 * Define a channel where clients are logged onto
 */
HornetChannel = function ( settings, name ) {
  this.settings = settings;
  this.logger = new Logger( this.settings['log_level'] );
  this.name = name;
  this.clients = [];
  this.redisPub = redis.createClient();
};

HornetChannel.prototype = {
  /**
   * Register a client to a channel
   */
  addClient : function( client ) {
    var redisPub = this.redisPub,
      clients = this.clients,
      that = this,
      token = client.token,
      socket = client.socket;
    
    clients[token] = client;
    
    redisPub.publish(
      consts['HORNET_EVENT_CONNECT_CHANNEL'], 
      JSON.stringify({ 
        token: token, 
        channel: this.name 
      })
    );
      
    this.logger.log('Channel:' + this.name + ' - connected token:' + client.token, module );

    client.on('disconnect', function() {
      var socket = client.socket;

      delete clients[token];

      this.logger.log('Channel:' + that.name + ' - disconnected token:' + token , module);

      redisPub.publish(
        consts["HORNET_EVENT_DISCONNECT_CHANNEL"], 
        JSON.stringify({ 
          token: token, 
          channel: that.name 
        })
      );
    });
  },

  /**
   * Sends a given message to every connected client, excepting some if needed
   */
  broadcast : function( message ) {
    this.logger.log('Channel: ' + this.name + ' - new message:' + message, module);

    message['channel'] = this.name;

    var clients = this.clients;

    if ( 'only' in message && message['only'] in clients ) {
      var client = clients[ message['only'] ];

      client.send( message );
      return;
    }

    for (var token in clients) {
      var client = clients[token];

      // if this message should not be sent to a specific client (identified by a token),
      // then continue
      if ( 'except' in message && message['except'] == client.token )
        continue;

      client.send( message );     
    }
  }
};



/**
 * Export the constructor.
 */
exports = module.exports = HornetChannel;