/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

 var consts = require('../lib/consts')
  , http = require('http')
  , c = require('./common')
  , should = require('should');


describe('Hornet static routes', function() {
  describe('GET /', function() {
    it('should return hornet welcome message', function( done ) {

      c.hornetReadyUp( function( hornet ) { 
        var options = {
          host: 'localhost',
          port: hornet.settings['port'],
          path: '/',
          method: 'GET'
        };

        var body = "";

        var req = http.request(options, function(res) { 
          res.setEncoding('utf8');

          res.on('data', function (chunk) {
            body = body + chunk;
          });

          res.on('end', function() {
            hornet.close();
             
            res.should.have.status(200);
            body.should.include('Hornet v');
            
            done();
          });
        });  
        
        req.end();    
      });
    });
  });

  describe('GET root', function() {
    it('should return hornet welcome message', function( done ) {

      c.hornetReadyUp( function( hornet ) { 
        var options = {
          host: 'localhost',
          port: hornet.settings['port'],
          path: '',
          method: 'GET'
        };

        var body = "";

        var req = http.request(options, function(res) { 
          res.setEncoding('utf8');

          res.on('data', function (chunk) {
            body = body + chunk;
          });

          res.on('end', function() {
            hornet.close();

            res.should.have.status(200);
            body.should.include('Hornet v');            

            done();
          });
        });  
        
        req.end();    
      })
    });
  });

  describe('GET hornet js file', function() {
    it('should return hornet js file', function( done ) {
      
      c.hornetReadyUp( function( hornet ) { 
        var options = {
          host: 'localhost',
          port: hornet.settings['port'],
          path: '/hornet/hornet.js',
          method: 'GET'
        };

        var body = "";
        var req = http.request(options, function(res) { 
          res.setEncoding('utf8');

          res.on('data', function (chunk) {
            body = body + chunk;
          });

          res.on('end', function() {
            hornet.close();

            res.should.have.status(200);

            body.should.include('var Hornet');
            body.should.include('Socket.IO.min.js');
            
            done();
          });
        });  
        
        req.end();    
      })
    });
  });
});
