var Hornet;

(function() {

var log = function( txt ) {
  if (console && console.log )
    console.log("Hornet: " + txt);
}

var delayedTimeout = function( callback, initialTime, maxTime ) {
  this.currentTime = initialTime;
  this.callback = callback;
  this.maxTime = 0 || maxTime;

  this.nextTick();
};

delayedTimeout.prototype = {
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
    var that = ctx ? ctx : this;

    that.nextTick();
    that.callback(that);
  },

  stop : function () {
    clearTimeout(this.timeout);
  }
}


Hornet = function (uri, channels, token){
  if ( arguments.length == 1 && typeof arguments[0] == 'object' ) {
    var opts = arguments[0];

    if ( ! opts['channels'] && ! opts['channel'] ) {
      log("You must at least provide a channel (channel param)");
      return;
    }

    this.uri = opts['uri'];
    this.channels = opts['channels'] ? opts['channels'] : [ opts['channel'] ];
    this.token = opts['token'];
  }
  else { // Deprecated
    log("Using constructor with multiples params instead of json object is deprecated and will be removed in Hornet 0.4" );

    this.uri = arguments[0];
    this.channels = arguments[1];
    this.token = arguments[2];
  }

  this.handlers = {};
}

Hornet.prototype = {
  /**
   * The connection status, false/disconnected, true: connected
   */
  connected : false,

  addHandler : function(channel, type, callback) {
    var handlers = this.handlers;

    if ( ! ( channel in handlers ) )
      handlers[channel] = {};

    if ( ! ( type in handlers[channel] ) )
      handlers[channel][type] = [];
    
    handlers[channel][type].push( callback );
  },

  removeHandler : function(channel, type, callback) {
    var handlers = this.handlers;

    if ( ( ! ( channel in handlers ) )  || ( ! ( type in handlers[channel] ) ) )
      return; // do nothing...

    for ( i in handlers[channel][type] ) {
      var handler = handlers[channel][type][i];

      if ( handler == callback ) {
        handlers[channel][type].splice(i, 1);
        return;
      }
    }
  },

  on : function(channel, type, callback) {
    if ( typeof channel == 'object') {
      for ( var i in channel ) {
        this.addHandler(channel[i], type, callback);
      }
    } 
    else {
      this.addHandler(channel, type, callback);
    }
  },

  un : function(channel, type, callback){
    if ( typeof channel == 'object') {
      for ( var i in channel ) {
        this.removeHandler(channel, type, callback);
      }
    } 
    else {
      this.removeHandler(channel, type, callback);
    }
  },

  connect : function () {
    var firstTime = true;

    if ( this.socket && this.socket.socket && this.socket.socket.connected ) {
      this.socket.disconnect();
      firstTime = false;
    }
    
    this.socket = io.connect( this.uri );
    var socket = this.socket;
    var that = this;

    if ( firstTime ) { 
      socket.on('connect', function(){
        that.connected = true;
        socket.send(JSON.stringify({token: that.token, channels: that.channels}));
      });
      
      socket.on('message', function( rawMessage ) {
        var message = JSON.parse( rawMessage );

        if ( ! ( "type" in message ) && ! ( "channel" in message ) ) {
          log("Wrong message format. Received: " + JSON.stringify(message) );
          return;
        }

        var type = message.type;
        var channel = message.channel;
        var handlers = that.handlers;

        if ( ! ( channel in handlers ) || ! ( type in handlers[channel] ) )
          return;

        for ( i in handlers[channel][type] ) {
          var handler = handlers[channel][type][i];

          handler( message );
        }
      });

      socket.on('disconnect', function(){
        var handlers = that.handlers;
        that.connected = false;
        
        if ( handlers['hornet'] != undefined && "disconnect" in handlers['hornet'] )  {
          for ( i in handlers['hornet']['disconnect'] ) {
            var handler = handlers['hornet']['disconnect'][i];
            handler();
          }
        }
        
        var reconnect = new delayedTimeout( function( self ) {
          if( ! that.connected )
            that.socket.socket.connect();
          else
            self.stop();
        }, 1000, 30000); // will try to reconnect after 1sec and will up to 30sec
      });
    }
  }
};

  
})();

var $h = Hornet;