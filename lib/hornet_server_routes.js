var utils = require("./utils"),
  fs = require('fs'),
  router = require("./hornet_server_router.js");

/**
 * root url
 * - /
 * -
 */
var root = function() {
  var hornetRequest = this.hornetRequest;

  hornetRequest.response.writeHeader(200);
  hornetRequest.response.end('<html><head><title>Hornet v0.01</title></head><body><h1>Hornet v' + HORNET_VERSION + '</h1></body></html>') 
}


router.set('/', 'root', root);
router.set('', 'root', root);


/**
 * Hornet JS client API
 * - /hornet/hornet.js
 */
var hornetJs = function() {
  var hornetRequest = this.hornetRequest;

  fs.readFile('./public/hornet.js', "binary", function(err, file) {  
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