var sys = require("sys"),
winston = require('winston');

var extend = function(target, object) {
	for (index in object) {
		target[index] = object[index];
	}

	return target;
};

var log = function (msg, module) {
  var moduleName;

  if ( ! module ) {
    moduleName = "";
  }
  else {
    var filename = module.filename;
    var slashX = filename.lastIndexOf("/");
    var moduleName = filename.substr(slashX + 1);
  }
    

  winston.info("[" + moduleName + "] " + msg.toString());
};

exports.extend = extend;
exports.log = log;