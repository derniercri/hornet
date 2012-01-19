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
  , Hornet = require('../lib/server');

require('../node_modules/socket.io/test/common');

var hornetReadyUp = function( callback ) {
  var hornet = new Hornet({
    'log_level' : 1
  });

  hornet.on('ready', function() {
    callback( hornet )
  });
  
  
  hornet.listen();      
};

exports.hornetReadyUp = hornetReadyUp;