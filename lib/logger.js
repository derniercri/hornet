/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var winston = require('winston');

/**
 * Just a wrapper around the log lib used
 * log levels:
 *  0 : silent
 *  1 : error
 *  2 : warm
 *  3 : info
 *  4 : debug
 */
function Logger( logLevel ) {
  this.logLevel = logLevel;
};

Logger.prototype = {
  debug : function( msg, module ) {
    if ( this.logLevel < 4 ) return;
    
    var moduleName = this._getModuleName( module );
    winston.info("[ DEBUG ] [" + moduleName + "] " + msg.toString());
  },
  
  error : function( msg, module ) {
    if ( this.logLevel < 1 ) return;
    
    var moduleName = this._getModuleName( module );
    winston.info("[ ERROR ] [" + moduleName + "] " + msg.toString());
  },

  info : function( msg, module ) {
    this.log( msg, module );
  },

  log : function( msg, module ) {
    if ( this.logLevel < 3 ) return;
    
    var moduleName = this._getModuleName( module );
    winston.info("[ INFO ] [" + moduleName + "] " + msg.toString());
  },

  warn : function( msg, module ) {
    if ( this.logLevel < 2 ) return;
    
    var moduleName = this._getModuleName( module );
    winston.info("[ WARN ] [" + moduleName + "] " + msg.toString());
  },

  _getModuleName : function( module ) {
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

    return moduleName;
  }
};

exports = module.exports = Logger;