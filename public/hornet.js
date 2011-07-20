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
    this.socket = io.connect( this.uri );
    var socket = this.socket;
    var that = this;


    socket.on('connect', function(){
      that.connected = true;

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
    });
    

    socket.on('disconnect', function(){ 
     	that.connected = false;
    });

    socket.send(JSON.stringify({token: this.token, channel: this.channel}));
  }
}
