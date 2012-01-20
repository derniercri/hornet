/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */


/**
 * Overwrite target with properties and functions from extension
 */
var extend = function( target, extension ) {
	for ( var index in extension )
		target[index] = extension[index];

	return target;
};

exports.extend = extend;