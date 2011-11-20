/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var sys = require("sys")
  , utils = require("./utils.js");

/**
 * Array containing registered routes
 */
var routes = [];
  
/**
 * Register a callback for a route which URI is route and name is routeName
 * The goal is to transform a route from a human readable format to a standard regular expression
 */
var set = function ( route, routeName, callback ) {
  var routeInit = route;
  var paramsNames = [];
  
  var paramX = route.indexOf( ':' );
  
  while ( paramX != -1 ) {
    var paramName;
    var paramY = route.indexOf('/', paramX);
    
    paramName = ( paramY != -1 ) ? route.substr( paramX + 1, paramY - paramX - 1 ) : route.substr( paramX + 1 );
    paramsNames.push(paramName);
    
    route =  route.substr( 0, paramX ) + '(\\w+)' + ( ( paramY != -1 ) ? route.substr( paramY ) : "");
    
    paramX = route.indexOf(':');
  }

  route = route.replace('\/','\\/');

  var routeRegExp = new RegExp("^" + route + '(\\?.*)?$');
  
  routes.push({
    route: routeRegExp,
    routeName: routeName,
    paramsNames: paramsNames, 
    callback : callback
  });

  utils.log('Added route - name:' + routeName + ' - format:' + routeInit, module);
  
  return this;
};

/**
 * Set the router to start (or stop) observing hash changes
 */
var serve = function ( request, response ) {
  utils.log('Incoming request: ' + request.url, module);

  var that = this,
    hornetRequest = new HornetRequest(request, response);

  for ( route in routes ) {
    var matches = request.url.match( routes[route].route );
    
    if ( matches != undefined ) {
      var paramsNames = routes[route].paramsNames;
      var params = {};
      
      i = 1;
      for ( param in paramsNames ) {
        params[paramsNames[param]] = matches[i];
        i++;
      }
      
      var o = {
        params: params,
        hornetRequest : hornetRequest,
        routeName : routes[route].routeName
      };

      routes[route].callback.apply(o);
      return;
    }
  }
  
  // if nothing matched, then die.
  utils.log('no route found for: ' + request.url, module);
  hornetRequest.die();
};


// exports
exports.set = set;
exports.serve = serve;
