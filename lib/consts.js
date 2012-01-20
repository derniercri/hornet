/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

require('pkginfo')(module, 'version');

/**
 * Hornet related constants are defined here
 */
var consts = {};

consts['DEFAULT_JSON_RESPONSE_HEADERS'] = {
  'Content-Type': "application/json",
  'Access-Control-Allow-Origin' : '*'
};

consts['ERROR_INVALID_TOKEN'] = 'INVALID_TOKEN';
consts['ERROR_WRONG_PARAMETERS'] = 'WRONG_PARAMETERS';
consts['ERROR_WRONG_TOKEN_ASSOCIATION'] = "WRONG_TOKEN_ASSOCIATION";

consts['INFO_CONNECTED'] = "CONNECTED";

consts['KILL_CONNECTION'] = 'TERMINATE';

consts['HORNET_CHANNEL'] = 'hornet';
consts['HORNET_USER_SPECIFIC_CHANNEL_PREFIX'] = consts['HORNET_CHANNEL'] + ':channel:';
consts['HORNET_EVENTS_CHANNEL'] = "events";
consts['HORNET_EVENT_CONNECT_CHANNEL'] = consts['HORNET_CHANNEL'] + ":" + consts['HORNET_EVENTS_CHANNEL'] + ":" + "connect";
consts['HORNET_EVENT_DISCONNECT_CHANNEL'] = consts['HORNET_CHANNEL'] + ":" + consts['HORNET_EVENTS_CHANNEL'] + ":" + "disconnect";
consts['HORNET_VERSION'] = module.exports['version'];

consts['SERVER_PORT'] = 8187;

consts['TYPE_ERROR_MESSAGE'] = "error";
consts['TYPE_INFO_MESSAGE'] = "info";


exports = module.exports = consts;