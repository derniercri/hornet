/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */


/**
 * Test dependencies
 */
var redis = require('redis')
  , utils = require('../lib/utils')
  , http = require('http')
  , HornetClient = require('../lib/hornet_client')
  , Hornet = require('../lib/server');

require('../node_modules/socket.io/test/common');

var hornetReadyUp = function( callback ) {
  var hornet = new Hornet({
    'log_level' : 1,
    'socketio_log_level' : 1
  });

  hornet.on('ready', function() {
    callback( hornet )
  });
  
  
  hornet.listen();      
};


var createStubSocket = function(onMessage) {
  return new function() {
    this.send = function( message ) {
      onMessage( JSON.parse(message) );
    };

    this.on = function() {};
  };
}

var createStubClient = function( onMessage ) {
  var socket = new function() {
    this.send = function( message ) {
      onMessage( JSON.parse(message) );
    };

    this.on = function() {};
  };

  var client = new HornetClient( "mockToken", socket );

  return client;
}


exports.hornetReadyUp = hornetReadyUp;
exports.createStubSocket = createStubSocket;
exports.createStubClient = createStubClient;