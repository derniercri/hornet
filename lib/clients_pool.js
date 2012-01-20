/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require('./consts')
  , utils = require('./utils.js');


function ClientsPool( options ) {
  this.clients = [];

  this.logger = options.logger;
}

ClientsPool.prototype = {
  /**
   * Return the client for a given token/socket association
   */
  get : function ( token, socket ) {
    // if client doesn't exist, we instanciate it
    if ( ! ( token in this.clients ) ) {  
      this.clients[token] = new HornetClient( token, socket );
      
      this.logger.log("Instanciating a new HornetClient for token:'" + token + "'", module);
    }

    var hornetClient = this.clients[token];

    return hornetClient;
  }
}

/**
 * Export the constructor.
 */
exports = module.exports = ClientsPool;