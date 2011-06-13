require ('./lib/hornet_const.js');

var utils = require("./lib/utils");

utils.log('Starting Hornet Server v' + HORNET_VERSION, module);

var	hornet = require("./lib/hornet_server.js");

hornet.start();

utils.log('Hornet Server started, waiting for connections...', module);