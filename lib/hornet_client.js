/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require('./consts')
  , utils = require('./utils');

/** 
 * Wraps a connection to a channel ( socket + token )
 */
HornetClient = function ( token, socket ) {
  this.token = token;
  this.socket = socket;
  this.events = [];

  // relay the disconnect event from socket io
  var that = this;
  this.socket.on('disconnect', function(args) {
    that.fire('disconnect', args);
  })
};

HornetClient.prototype = {
  /**
   * Fire an event. Will execute any callback attached to it
   */
  fire :  function( eventName, args ) {
    if ( ! eventName in this.events )
      return;

    var handlers = this.events[eventName];
       
    for ( var i in handlers ) {
      handlers[i].call(this, args);
    }
  },

  /**
   * Close permanently this socket
   */
  die : function() { 
    if (this.sockets == undefined) {
    	// well, do nothing?
      return;
	  }
	
    this.client.send( consts.KILL_CONNECTION ); // TODO : check in hornet client if this is correctly interpreted
    utils.log("Connection killed for token:'" + this.token + "'", module);
  },

  /**
   * Register a callback for event named eventName
   */
  on : function( eventName , callback) {
    var events = this.events;

    if ( ! eventName in events ) 
      events[eventName] = [];

    events[eventName].push( callback );
  },

  /**
   * Send a message on this socket as a stringified JSON
   */
  send : function( msg ) {
    this.socket.send( JSON.stringify( msg ) );
  }
};