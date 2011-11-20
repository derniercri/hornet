/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var sys = require("sys")
  , winston = require('winston');


/**
 * Overwrite target with properties and functions from extension
 */
var extend = function( target, extension ) {
	for (index in extension)
		target[index] = extension[index];

	return target;
};


/**
 * Log to console, with some basic output rendering, using winston log lib.
 */
var log = function( msg, module ) {
  var moduleName;

  if ( ! module ) {
    moduleName = "Unknown module";
  }
  else {
    var filename = module.filename;
    var slashX = filename.lastIndexOf("/");
    var moduleName = filename.substr(slashX + 1);

    var dotX = moduleName.lastIndexOf(".");
    if ( dotX != -1 ) {
      moduleName = moduleName.substr( 0, dotX );
    }
  }
    
  winston.info("[" + moduleName + "] " + msg.toString());
};

exports.extend = extend;
exports.log = log;