/*!
 * Hornet
 * Copyright(c) 2011 Nectify <dev@nectify.com>
 * Apache 2.0 Licensed
 */

var utils = require("./utils.js");


function Router( logger ) {
  this.logger = logger;

  // contains registred routes
  this.routes = [];
};

Router.prototype = {
  /**
   * Register a callback for a route which URI is route and name is routeName
   * The goal is to transform a route from a human readable format to a standard regular expression
   */
  set : function( route, routeName, callback ) {
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
    
    this.routes.push({
      route: routeRegExp,
      routeName: routeName,
      paramsNames: paramsNames, 
      callback : callback
    });

    this.logger.log('Added route - name:' + routeName + ' - format:' + routeInit, module);
  },

  /**
   * Set the router to start (or stop) observing hash changes
   */
  serve : function( request, response ) {
    this.logger.log('Incoming request: ' + request.url, module);

    var routes = this.routes;

    var hornetRequest = new HornetRequest(request, response);

    for ( var route in routes ) {
      var matches = request.url.match( routes[route].route );
      
      if ( matches != undefined ) {
        var paramsNames = routes[route].paramsNames;
        var params = {};
        
        var i = 1;
        for ( var param in paramsNames ) {
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
  },
};


/**
 * Export the constructor.
 */

exports = module.exports = Router;