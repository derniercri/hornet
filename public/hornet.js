var delayedTimeout = function( callback, initialTime, maxTime ) {
  this.currentTime = initialTime;
  this.callback = callback;
  this.maxTime = 0 || maxTime;

  this.nextTick();
}

delayedTimeout.prototype = {
  stop : function () {
    clearTimeout(this.timeout);
  },

  nextTick : function() {

    if ( ! this.previousTime )
      this.previousTime = 0;

    var newTime = this.previousTime + this.currentTime;

    this.previousTime = this.currentTime;
    this.currentTime = newTime;

    if ( newTime > this.maxTime )
      newTime = this.maxTime;

    var that = this;
    this.timeout = setTimeout(function() { that.onTimeout( that ) } , newTime);
  },

  onTimeout : function( ctx ) {
    var that = this;

    if ( ctx )
      that = ctx;
    
    that.nextTick();
    
    that.callback(that);

    
  }
}

var Hornet = function (uri, channels, token){
  this.uri = uri;
  this.token = token;
  this.channels = channels;
  this.handlers = [];
}

Hornet.prototype = {
  addHandler : function(channel, type, callback) {
    var handlers = this.handlers;

    if ( handlers[channel] == undefined )
      handlers[channel] = {};
    if ( handlers[channel][type] == undefined )
      handlers[channel][type] = [];
    
    handlers[channel][type].push( callback );
  },
  //Connection status 
  connected : false,

  removeHandler : function(channel, type, callback) {
    var handlers = this.handlers;

    if ( handlers[channel] == undefined  && handlers[channel][type] )
      return; // do nothing...

    for ( i in handlers[channel][type] ) {
      var handler = handlers[channel][type][i];

      if ( handler == callback ) {
        handlers[channel][type].splice(i, 1);
        break;
      }
    }
  },

  on : function(channel, type, callback) {
    if ( typeof channel == 'object') {
      for ( var i in channel ) {
        this.addHandler(channel[i], type, callback);
      }
    } else {
      this.addHandler(channel, type, callback);
    }
  },

  un : function(channel, type, callback){
    if ( typeof channel == 'object') {
      for ( var i in channel ) {
        this.removeHandler(channel, type, callback);
      }
    } else {
      this.removeHandler(channel, type, callback);
    }
  },

  connect : function () {
    this.socket = io.connect( this.uri );
    var socket = this.socket;
    var that = this;


    socket.on('connect', function(){
    
      that.connected = true;
      
      socket.send(JSON.stringify({token: that.token, channels: that.channels}));

    });
    
    socket.on('message', function( rawMessage ) {
      var message = JSON.parse( rawMessage );

      if ( ! message.type && ! message.channel )
        return;

      var type = message.type;
      var channel = message.channel;
      var handlers = that.handlers;

      if ( handlers[channel] == undefined || handlers[channel][type] == undefined )
        return;

      for ( i in handlers[channel][type] ) {
        var handler = handlers[channel][type][i];

        handler( message );
      }
    });

    socket.on('disconnect', function(){
      var handlers = that.handlers;
      that.connected = false;
      
      if ( handlers['disconnect'] != undefined )
      {
        for ( i in handlers['disconnect'] ) {
          var handler = handlers['disconnect'][i];
          handler();
        }
      }
      
      var reconnect = new delayedTimeout( function(self){
        if( ! that.connected )
          that.socket.socket.connect();
        else
          self.stop();
      }, 5000, 30000);
    });

    
  }
}
