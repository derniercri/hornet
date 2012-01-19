/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require('./consts');

/**
 * Wraps a standard http request to a Hornet version of it, with some added flavor
 */
HornetRequest = function(request, response) {
  this.request = request;
  this.response = response;  
};

HornetRequest.prototype = {
  die : function() { 
    this.response.writeHeader( 400, consts['DEFAULT_JSON_RESPONSE_HEADERS'] ); 
    this.response.end( consts['KILL_CONNECTION'] );
  }
}