var sys = require("sys"),
 utils = require("./utils.js");

var routes = [];
  
var set = function ( route, routeName, callback ) {
  var paramsNames = [];
  
  var paramX = route.indexOf( ':' );
  
  while( paramX != -1 ) {
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

  utils.log('added route:' + routeName + ' pattern:' + route, module);
  
  return this;
};

/**
 * Set the router to start (or stop) observing hash changes
 */
var serve = function ( request, response ) {
  utils.log('incoming request: ' + request.url, module);

  var that = this,
    hornetRequest = new HornetRequest(request, response);

  for ( route in routes ) {
    var matches = request.url.match( routes[route].route );
    
    if ( matches != undefined ) {
      var paramsNames = routes[route].paramsNames;
      params = {};
      
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
  
  // if nothing matched
  utils.log('no route found for: ' + request.url, module);
  hornetRequest.die();
};


// exports
exports.set = set;
exports.serve = serve;
