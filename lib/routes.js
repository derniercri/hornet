/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */


var consts = require('./consts')
  , utils = require("./utils")
  , fs = require('fs')
  , router = require("./router");

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

router.set('/', 'root', root);
router.set('', 'root', root);


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
  
    hornetRequest.response.writeHeader(200);  
    hornetRequest.response.write(file, "binary"); 
    hornetRequest.response.end();
  });   
}

router.set('/hornet/hornet.js', 'hornet', hornetJs)