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

var Hornet = function (uri, channel, token){
  this.uri = uri;
  this.token = token;
  this.channel = channel;
  this.handlers = [];
}

Hornet.prototype = {
  addHandler : function(type, callback) {
    var handlers = this.handlers;

    if ( handlers[type] == undefined )
      handlers[type] = [];
    
    handlers[type].push( callback );
  },
  //Connection status 
  connected : false,

  removeHandler : function(type, callback) {
    var handlers = this.handlers;

    if ( handlers[type] == undefined )
      return; // do nothing...

    for ( i in handlers[type] ) {
      var handler = handlers[type][i];

      if ( handler == callback )
        handlers[type].splice(i, 1);
    }
  },

  on : function(type, callback) {
    this.addHandler(type,callback);
  },

  un : function(type, callback){
    this.removeHandler(type,callback);
  },

  connect : function () {
    this.socket = io.connect( this.uri );
    var socket = this.socket;
    var that = this;


    socket.on('connect', function(){
    
      that.connected = true;
      
      socket.send(JSON.stringify({token: that.token, channel: that.channel}));

    });
    
    socket.on('message', function( rawMessage ) {
        var message = JSON.parse( rawMessage );

        if ( ! message.type )
          return;

        var type = message.type;
        var handlers = that.handlers;

        if ( handlers[type] == undefined )
          return;

        for ( i in handlers[type] ) {
          var handler = handlers[type][i];

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
