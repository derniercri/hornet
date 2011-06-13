require('./hornet_events.js');

var utils = require('./utils.js'),
  redis = require('redis');

HornetChannel = function ( name ) {
  this.name = name;
  this.clients = [];
  this.redisPub = redis.createClient();
};

HornetChannel.prototype = {
  addClient : function( client ) {
    var redisPub = this.redisPub,
      clients = this.clients,
      that = this,
      token = client.token,
      socket = client.socket;
    
    this.clients[token] = client;      
    redisPub.publish("hornet:events:connect", JSON.stringify({ token: token, channel: this.name }));
      
    utils.log('New client added token:' + client.token, module );

    client.on('disconnect', function() {
      var socket = client.socket;

      delete clients[token];

      utils.log('Disconnected token:' + token + ' from channel:' + that.name, module);

      redisPub.publish("hornet:events:disconnect", JSON.stringify({ token: token, channel: that.name }));
    });
  },


  broadcast : function( message ) {
    utils.log('New message on channel:' + this.name + " message:" + message, module);

    var clients = this.clients;

    for (var token in clients) {
      var client = clients[token];

      utils.log("Going to send to token:" + token, module);

      if ( message.except && message.except == client.token ) {
        continue;
      } 
      
      client.send(message);     
    }
  }
};