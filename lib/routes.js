/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */


var consts = require('./consts')
  , utils = require("./utils")
  , fs = require('fs')
  , uglifyjs = require('uglify-js');

/**
 * root url
 * Match: /
 * Match: 
 */
var root = function() {
  var hornetRequest = this.hornetRequest;

  hornetRequest.response.writeHeader(200);
  hornetRequest.response.end('<html><head><title>Hornet</title></head><body><h1>Hornet v' + consts['HORNET_VERSION'] + '</h1></body></html>') 
}

/**
 * Hornet JS client API
 * TODO : Should be uglified and concatenate socket.io libs
 * Match: /hornet/hornet.js
 */
var hornetJs = function() {
  var hornetRequest = this.hornetRequest;

  fs.readFile(__dirname + '/../public/hornet.js', "binary", function(err, file) {  
    if ( err ) {  
      hornetRequest.response.writeHeader(500, {"Content-Type": "text/plain"});  
      hornetRequest.response.write(err + "\n");  
      hornetRequest.response.end();  

      return;  
    }
    
    var uglified = uglifyjs( file );

    // let's include socket.io client lib in it;
    fs.readFile(__dirname + '/../node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.min.js', "binary", function( err, socketioMin ) {
      if ( err ) {
        hornetRequest.response.writeHeader(500, {"Content-Type": "text/plain"});  
        hornetRequest.response.write(err + "\n");  
        hornetRequest.response.end();  

        return;  
      }
      
      var finalFile = socketioMin + "\n" + uglified;


      hornetRequest.response.writeHeader(200);   
      hornetRequest.response.write( finalFile , "binary"); 
      hornetRequest.response.end();
    });
  });   
}

var routes = {
  '' : {
    id : 'root',
    handler : root
  },

  '/' : {
    id : 'root',
    handler : root
  },

  '/hornet/hornet.js' : {
    id: 'hornet',
    handler : hornetJs
  }
};


exports = module.exports = routes;