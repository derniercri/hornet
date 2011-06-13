var utils = require('./utils.js');

var hornetClients = [];

var get = function ( token, socket ) {
  if ( hornetClients[token] == undefined ) {  
    hornetClients[token] = new HornetClient(token, socket);
    
    utils.log('Creating new client for token"' + token + '"', module);
  }

  var hornetClient = hornetClients[token];

  return hornetClient;
};

exports.get = get;

// TODO : set timer to unsubscribe empty channels