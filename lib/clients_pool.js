/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require('./consts')
  , utils = require('./utils.js');

/**
 * Contains connected clients
 */
var hornetClients = [];

/**
 * Return the client for a given token/socket association
 */
var get = function ( token, socket ) {
  // if client doesn't exist, we instanciate it
  if ( ! ( token in hornetClients ) ) {  
    hornetClients[token] = new HornetClient(token, socket);
    
    utils.log("Instanciating a new HornetClient for token:'" + token + "'", module);
  }

  var hornetClient = hornetClients[token];

  return hornetClient;
};

exports.get = get;

// TODO : set timer to unsubscribe empty channels