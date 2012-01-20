/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

 var consts = require('../lib/consts')
  , c = require('./common')
  , http = require('http')
  , io = require('socket.io-client')
  , should = require('./common')
  , ChannelsHub = require('../lib/channels_hub')
  , HornetClient = require('../lib/hornet_client')
  , redis = require("redis");

require('../lib/hornet_request');

redis = redis.createClient();
redis.on("error", function (err) {
  console.log("err");
});


describe('Client', function() {

  describe('connected on one single channel', function() {
    it( 'should receive a message when one is published on redis', function ( done ) {
      var hub = new ChannelsHub({
        'log_level' : 1
      });

      var channel = "test_channel";

      var client = c.createStubClient(function( message ) {
        message.should.have.property('type','test');
        done();
      });

      hub.subscribe( channel, client );

      // timeout to ensure that we are subscribed
      setTimeout( function() {
        redis.publish(consts['HORNET_USER_SPECIFIC_CHANNEL_PREFIX'] + channel, JSON.stringify( { type: "test" } ) )  
        }, 100);
    }); 
  });


describe('connected on multiples channel', function() {
    it( 'should receive a message when one is published on redis', function ( done ) {
      var hub = new ChannelsHub({
        'log_level' : 1
      });

      var channel1 = "test_multiple_channels1"
        , channel2 = "test_multiple_channels2";

      var lock1 = false
        , lock2 = false;

      var sync = function() {
        if ( lock1 && lock2 )
          done();
      };

      var client = c.createStubClient(function( message ) {
        // console.log( JSON.stringify( message ) );

        if ( message['channel'] == channel1 ) {
          message.should.have.property('type','test');
          lock1 = true;
        }

        if ( message['channel'] == channel2 ) {
          message.should.have.property('type','test2');
          lock2 = true;
        }
        
        sync();
      });

      hub.subscribe( channel1, client );
      hub.subscribe( channel2, client );

      // timeout to ensure that we are subscribed
      setTimeout( function() {
        redis.publish(consts['HORNET_USER_SPECIFIC_CHANNEL_PREFIX'] + channel1, JSON.stringify( { type: "test" } ) )  
        redis.publish(consts['HORNET_USER_SPECIFIC_CHANNEL_PREFIX'] + channel2, JSON.stringify( { type: "test2" } ) )  
        }, 100);
    }); 
  });


});