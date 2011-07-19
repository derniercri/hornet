require('./hornet_const.js');

var utils = require('./utils.js');

/** 
 * Wraps a connection to a channel ( socket + token )
 */
HornetClient = function ( token, socket ) {
  this.token = token;
  this.socket = socket;
  this.events = [];

  var that = this;
  this.socket.on('disconnect', function(args) {
    that.fire('disconnect', args);
  })
};


HornetClient.prototype = {
  fire :  function( eventName, args ) {
    if ( ! this.events[eventName] )
      return;

    var handlers = this.events[eventName];
       
    for ( i in handlers ) {
      handlers[i].call(this, args);
    }
  },

  die : function() { 
    if (this.sockets == undefined) {
    	// well, do nothing?
      return;
	  }
	
    this.client.send("do not come back"); 
    utils.log("Client '" + this.token + "' disconnect : die ", module);
  },

  on : function( eventName , callback) {
    var events = this.events;

    if ( ! events[eventName] ) 
      events[eventName] = [];

    events[eventName].push( callback );
  },

  send : function( msg ) {
    this.socket.send( JSON.stringify( msg ) );
  }
}
