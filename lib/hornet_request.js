require('./hornet_const.js');

HornetRequest = function(request, response) {
  this.request = request;
  this.response = response;
  
};


HornetRequest.prototype = {
  die : function() { 
    this.response.writeHeader(400, HORNET_DEFAULT_HEADERS); 
    this.response.end("see you...");
  }
}