/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

 var consts = require('consts')
  , http = require('http')
  , should = require('./common');

require('hornet_request');



/**
 * Test.
 */

module.exports = {

  'test hornet request correctly wraps request and response': function (done) {
    var serve = function( request, response ) {
      var hornetRequest = new HornetRequest( request, response );

      request.should.eql( hornetRequest.request );
      response.should.eql( hornetRequest.response );

      response.end();
    };
    
    var httpServer = http.createServer( serve );
    httpServer.listen( consts['SERVER_PORT'] );

    var cl = client( consts['SERVER_PORT'] );

    cl.get('/', function( res, data ) {
      cl.end();
      httpServer.close();
      done();
    });
  },

  'test hornet request die correctly end the request with 400 error code': function (done) {
    var serve = function( request, response ) {
      var hornetRequest = new HornetRequest( request, response );

      hornetRequest.die();
    };
    
    var httpServer = http.createServer( serve );
    httpServer.listen( consts['SERVER_PORT'] );

    var cl = client( consts['SERVER_PORT'] );

    cl.get('/', function( res, data ) {
      res['statusCode'].should.eql(400);
      cl.end();
      httpServer.close();
      done();
    });
  }
}