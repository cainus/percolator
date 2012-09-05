var Router = require('detour').Router;
var Reaper = require('reaper').Reaper;
var UriUtil = require('./uriUtil').UriUtil;
var connect = require('connect');
var http = require('http');
var https = require('https');
var EventEmitter = require('events').EventEmitter;
var StatusManager = require('./StatusManager').StatusManager;
var JsonResponder = require('./JsonResponder');
var _ = require('underscore');

var authenticateContextHelper = function($, cb){
    // if handler has a fetch defined, call it.
    var authenticate = $.authenticate || $.app.authenticate;
    if (!!authenticate && (typeof(authenticate) == 'function')){
      authenticate($, function(err, authenticated){
        if (!!err){
          if (err === true){
            // if it returns an error, throw a 401
            return $.status.unauthenticated();
          } else {
            return $.status.internalServerError(err);
          }
        }
        // if it returns an object set handler.fetched
        $.authenticated = authenticated;
        cb();  // no error
      });
    } else {
      cb();  // no error if no authenticate()
    }

};

var fetchContextHelper = function($, cb){
    // if handler has a fetch defined, call it.
    if (!!$.fetch && (typeof($.fetch) == 'function')){
      $.fetch($, function(err, fetched){
        if (!!err){
          if (err === true){
            // if it returns an error, throw a 404
            return $.status.notFound($.req.url);
          } else {
            return $.status.internalServerError(err);
          }
        }
        // if it returns an object set handler.fetched
        $.fetched = fetched;
        cb();  // no error
      });
    } else {
      cb();  // no error if no fetch()
    }
};


Percolator = function(options){
  options = options || {};
  this.server = null;
  this.options = options;
  this.options.port = this.options.port || 3000;
  this.options.protocol = this.options.protocol || 'http';
  this.options.resourcePath = this.options.resourcePath || '/';
  this.options.parseBody = this.options.parseBody || false;
  this.port = this.options.port;
  this.protocol = this.options.protocol;
  this.resourcePath = this.options.resourcePath;
  this.router = new Router(this.resourcePath);
  var router = this.router;
  var protocol = this.protocol;
  var that = this;
  this.statusman = new StatusManager();
  this.statusman.on('error', function(errorObject){
    that.emit("errorResponse", errorObject);
  });
  this.mediaTypes = new Reaper();
  this.router.onRequest = function(handler, req, res, cb){
    handler.uri = new UriUtil(router, req.url, protocol, req.headers.host);
    handler.status = that.statusman.createResponder(req, res);
    handler.repr = that._getRepr(req, res);
    handler.req = req;
    handler.res = res;
    authenticateContextHelper(handler, function(){
      fetchContextHelper(handler, function(){
        if (!!that.options.parseBody){
          that.mediaTypes.connectMiddleware(handler)(req, res, function(err){
            if (!!err) {
              if (err.match(/^Parse Error:/)){
                that.statusman.createResponder(req, res).badRequest(err);
                return;
              }
              if (err === "Missing Content-Type"){
                that.statusman.createResponder(req, res).unsupportedMediaType("None provided.");
                return;
              }
              if (err === "Unregistered content-type."){
                that.statusman.createResponder(req, res).unsupportedMediaType(req.headers['content-type']);
                return;
              } 
              console.log("post mediaTypes middleware error:");
              console.log(err);
              return cb(err);
            } else {
              cb(null, handler);
            }
          });
        } else {
          handler.onBody = bodyParser(handler, req);
          cb(null, handler);
        }
      });
    });
  };
  // TODO create a handler.onAuthenticate that allows the user to
  //      set his own auth scheme (that returns a user!) in the server.js
  //      - should run if authAll is true OR
  //      - should run in handlers when handler.onAuthenticate is called
  this._assignErrorHandlers();
  this.registerMediaTypes();
  this.middlewareManager = connect();
  if (!!options.staticDir){
    this.staticDir = options.staticDir;
    this.middlewareManager.use(connect['static'](this.staticDir));
  }
  this.middlewareManager.use(function(req, res, next){
    var accept = req.headers.accept || '*/*';
    if (!that.mediaTypes.isAcceptable(accept)){
      that.statusman.createResponder(req, res).notAcceptable();
    } else {
      return next();
    }
  });
  this.router.on("route", function(resource){
    that._decorateResource(resource);
  });
};

Percolator.prototype = Object.create(EventEmitter.prototype);


Percolator.prototype.route = function(path, handler){
  this.router.route(path, handler);
};

Percolator.prototype._getRepr = function(req, res){
  var mediaTypes = this.mediaTypes;
  var accept = req.headers.accept;
  return function(data){
    // TODO what if request.headers.accept isn't set at all??
    var obj = mediaTypes.output(accept, data);
    res.setHeader('content-type', obj.type);
    res.end(obj.content);
  };
};


Percolator.prototype._getMethods = function(resource){
  var serverSupportedMethods = ["GET", "POST", 
                                "PUT", "DELETE",
                                "HEAD", "OPTIONS"];
  var moduleMethods = _.functions(resource);
  var methods = _.intersection(moduleMethods, serverSupportedMethods);
  var additionalMethods = ['OPTIONS'];
  if (_.isFunction(resource.GET)){
    additionalMethods.push('HEAD');
  }
  methods = _.union(additionalMethods, methods);
  return methods;
};

Percolator.prototype._setOptionsHandler = function(resource){
  // tell each resource how to respond to OPTIONS
  if (!!resource.input){
    var that = this;
    resource.input.OPTIONS = function(req, res){
      var responder = that.statusman.createResponder(req, res);
      return responder.OPTIONS(that._getMethods(resource.input));
    };
  }

};

// run the directory router and call the callback afterward
Percolator.prototype.routeDirectory = function(directory, cb){
  this.router.routeDirectory(directory, cb);
};


Percolator.prototype._decorateResource = function(resource){

  resource.router = this.router;
  this._setOptionsHandler(resource);
  // PERCOLATOR: tell each resource how to handle 404s.
  // THINK: shouldn't each resource know about all errors?
  if (!resource.handle404){
    resource.handle404 = function(req, res){
      this.router.handle404(req, res);
    };
  }
  // PERCOLATOR: set 'app' for all resources
  resource.app = this.options;
  // PERCOLATOR: set getAbsoluteUrl() for all resources?
  resource.getAbsoluteUrl = function(hostname, path){
    var abs = this.app.protocol + '://' + hostname + path;
    return abs;
  };
};

// register error handlers for each content type
Percolator.prototype._assignErrorHandlers = function(){
  // tell the router about the error handlers it can use
  var statusman = this.statusman;
  var router = this.router;

  router.handle414 = function(req, res){
    statusman.createResponder(req, res).requestUriTooLong();
  };

  router.handle404 = function(req, res){
    // TODO fix resource.fetch to use this handle404 instead of default!!!
    var responder = statusman.createResponder(req, res);
    responder.notFound(req.url);
  };

  router.handle405 = function(req, res){
    statusman.createResponder(req, res).methodNotAllowed();
  };

  router.handle501 = function(req, res){
    statusman.createResponder(req, res).notImplemented();
  };

  router.handle500 = function(req, res, ex){
    console.log("===============================");
    console.log("Uncaught Exception");
    console.log(ex);
    console.log(req.method, ' ', req.url);
    console.log(ex.stack);
    statusman.createResponder(req, res).internalServerError();
  };


};

Percolator.prototype.registerMediaType = function(type, instr, outobj){
  this.mediaTypes.register(type, instr, outobj);
};

Percolator.prototype.registerStatusResponder = function(type, responder){
  this.statusman.register(type, responder);
};

Percolator.prototype.registerMediaTypes = function(){
  var jsonType = require('./mediaTypes/json');
  this.registerMediaType('application/json', jsonType.fromString, jsonType.toString);
  //var xmlType = require('./mediaTypes/xml');
  // this.registerMediaType('application/xml', xmlType.in, xmlType.out);

  this.registerStatusResponder('application/json',  JsonResponder);

};

Percolator.prototype.use = function(middleware){
  this.middlewareManager.use(middleware);
};

Percolator.prototype.listen = function(cb){
  this.use(this.router.connectMiddleware);
  var protocolLibrary = this.protocol === 'https' ? https : http;
  this.server = protocolLibrary.createServer(this.middlewareManager);
  this.server.listen(this.port, cb);
};

Percolator.prototype.close = function(cb){
  this.server.close(cb);
};


var bodyParser = function(handler, req){
  var onBody = function(){
    var cb = _.last(arguments);
    // last arg must be a callback
    // example "accept only" (throws errors for unsupported types ) 
    //   onBody(['application/json', application/xml'], function(err, type, body){ ... });
    // example "accept all types"
    //   onBody(function(err, type, body){ ... });
    // TODO: max-size parameter?
    // TODO: whether parseBody is true or not, we should use the same handler either way.
    // TODO: reaper kind of sucks.
    var body = '';
    req.on('data', function(data){
      body += data;
    });
    req.on('end', function(){
      handler.rawBody = body;
      handler.body = body;
      return cb(body);
    });
  };
  return onBody;
};


module.exports = Percolator;
