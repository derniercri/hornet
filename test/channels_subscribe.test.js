/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var consts = require("../lib/consts"),
  c = require("./common"),
  http = require("http"),
  io = require("socket.io-client"),
  should = require("./common"),
  Hornet = require("../lib/server"),
  redis = require("redis");

require("../lib/hornet_request");

redis = redis.createClient();

redis.on("error", function(err) {
  console.log("err");
});

describe("Hornet Channel Subscribe", function() {
  it("should correctly connect", function(done) {
    done();
    return;

    c.hornetReadyUp(function(hornet) {
      var uri = "http://localhost:" + hornet.settings["port"];

      var socket = io.connect(uri);

      socket.on("connect", function() {
        hornet.close();
        socket.close();
        done();
      });

      console.log("socket:" + socket.connected);
    });
  });

  it("should correctly handles connection on message", function(done) {
    done();
    return;

    c.hornetReadyUp(function(hornet) {
      var uri = "http://localhost:" + hornet.settings["port"];

      var socket = io.connect(uri);

      socket.on("connect", function() {
        hornet.close();
        socket.close();
        done();
      });

      console.log("socket:" + socket.connected);
    });
  });

  it("should disconnect client if message is empty", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    var socket = c.createStubSocket(function(message) {
      message.should.have.property("type", "error");
      done();
    });

    hornet.handleConnection(socket, "");
  });

  it("should disconnect client if message is empty json", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    var socket = c.createStubSocket(function(message) {
      message.should.have.property("type", "error");
      done();
    });

    hornet.handleConnection(socket, "{}");
  });

  it("should disconnect client if message does not contains channel", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    var socket = c.createStubSocket(function(message) {
      message.should.have.property("type", "error");
      message.should.have.property("error", "WRONG_PARAMETERS");
      done();
    });

    hornet.handleConnection(socket, '{ token: "azlkdlsk"}');
  });

  it("should disconnect client if message does not contains token", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    var socket = c.createStubSocket(function(message) {
      message.should.have.property("type", "error");
      message.should.have.property("error", "WRONG_PARAMETERS");
      done();
    });

    hornet.handleConnection(socket, '{ channels: "azlkdlsk"}');
  });

  it("should disconnect client if token is not in redis", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    var socket = c.createStubSocket(function(message) {
      //console.log(JSON.stringify( message ));
      message.should.have.property("type", "error");
      message.should.have.property("error", "INVALID_TOKEN");
      done();
    });

    hornet.handleConnection(
      socket,
      '{ "token": "ayaya", "channels": "azlkdlsk"}'
    );
  });

  it("should disconnect client if no channels is associated to token", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    redis.sadd("hornet:token:test3", "");

    var socket = c.createStubSocket(function(message) {
      //console.log(JSON.stringify( message ));
      message.should.have.property("type", "error");
      message.should.have.property("error", "WRONG_TOKEN_ASSOCIATION");
      done();
    });

    hornet.handleConnection(
      socket,
      '{ "token": "test3", "channels": ["azlkdlsk"] }'
    );
  });

  it("should disconnect client if one or more channels are not associated to token", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    redis.sadd("hornet:token:test6", "chan1");

    var socket = c.createStubSocket(function(message) {
      //console.log(JSON.stringify( message ));
      message.should.have.property("type", "error");
      message.should.have.property("error", "WRONG_TOKEN_ASSOCIATION");
      done();
    });

    hornet.handleConnection(
      socket,
      '{ "token": "test6", "channels": ["chan1", "chan2"]}'
    );
  });

  it("should connect if each channel are  associated to token", function(done) {
    var hornet = new Hornet({
      log_level: 1,
      socketio_log_level: 1
    });

    redis.sadd("hornet:token:test5", "chan1");
    redis.sadd("hornet:token:test5", "chan2");

    var socket = c.createStubSocket(function(message) {
      // console.log(JSON.stringify( message ));
      message.should.have.property("type", "info");
      message.should.have.property("msg", "CONNECTED");
      done();
    });

    hornet.handleConnection(
      socket,
      '{ "token": "test5", "channels": ["chan1", "chan2"]}'
    );
  });
});
