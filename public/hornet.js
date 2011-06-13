var Hornet = function (url, port, channel, token){
  this.url = url;
  this.port = port;
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

  removeHandler : function(type, callback) {
    var handlers = this.handlers;

    if ( handlers[type] == undefined)
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
    this.socket = new io.Socket( this.url, {port: this.port} );
    var socket = this.socket;
    var that = this;

    socket.on('connect', function(){});


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
    });

    socket.connect();
    socket.send(JSON.stringify({token: this.token, channel: this.channel}));
  }
}