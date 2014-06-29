var Reaper = require('reaper');
var onbody = require('onbody');
var EventEmitter = require('events').EventEmitter;
var index = require('../index');
var JsonResponder = require('json-status');
var onJsonHelper = index.onJsonHelper;
var fetchHelper = index.FetchHelper;
var AuthenticateHelper = index.AuthenticateHelper;
var BasicAuthenticateHelper = index.BasicAuthenticateHelper;
var ObjectHelper = index.ObjectHelper;
var StatusManager = index.StatusManager;
var _ = require('underscore');
var fs = require('fs');
var Server = require('oneone');
var hyperjsonBrowser = require('hyperjson-browser');
var connect = require('connect');
var nodePath = require('path');
var urlgreyConnect = require('urlgrey-connect');
var hyperjsonConnect = require('hyperjson-connect');
var logger = require('log-driver').logger;


var Percolator = function(options){
  if (!(this instanceof Percolator)) {
    return new Percolator(options);
  }
  var that = this;
  this.connectApp = connect();
  options = options || {};
  this.options = options;
  this.options.port = this.options.port || 3000;
  this.options.ip = this.options.ip || '0.0.0.0';
  if (this.options.autoLink !== false){
    this.options.autoLink = true;
  }
  var autoLink = this.options.autoLink;
  this.options.protocol = this.options.protocol || 'http';
  this.options.resourcePath = this.options.resourcePath || '/';
  this.options.parseBody = this.options.parseBody || false;
  this.port = this.options.port;
  this.ip = this.options.ip;
  this.protocol = this.options.protocol;
  this.defaultLinks = this.options.autoLink;
  this.resourcePath = this.options.resourcePath;
  var serverOptions = {};
  if (this.ip){serverOptions.hostname = this.ip;}
  ["port", "protocol", "resourcePath", "cert", "key", "pfx", "defaultLinks"].forEach(function(prop){
    if (that[prop]){
      serverOptions[prop] = that[prop];
    }
  });
  this.server = new Server(serverOptions);
  if (!!options.staticDir){
    this.staticDir = options.staticDir;
  }
  var protocol = this.protocol;
  this.statusman = new StatusManager();
  this.statusman.on('error', function(errorObject){
    that.emit("errorResponse", errorObject);
  });
  this.mediaTypes = new Reaper();
  this.onRequestHandler = function(req, res, handler, cb){
    cb();  // do nothing with it by default
  };
  this.server.onRequest(function(handler, context, cb){
    var req = context.req;
    var res = context.res;
    that.connectApp.use(urlgreyConnect(protocol));
    that.connectApp.use(hyperjsonConnect({
      protocol : protocol,
      defaultLinks : autoLink
    }));
    that.connectApp(req, res, function(){
      req.app = that.options;
      var router = that.server.router;
      req.router = router;
      res.status = that.statusman.createResponder(req, res);

      that.onRequestHandler(req, res, handler, function(){
        var accept = req.headers.accept || '*/*';
        if (!that.mediaTypes.isAcceptable(accept)){
          that.statusman.createResponder(req, res).notAcceptable();
        } else {
          that.defaultRequestHandler(req, res, handler, cb);
        }
      });
    });
  });
  this._assignErrorHandlers();
  this.registerMediaTypes();

  this.server.onOPTIONS(function(resource){
    resource.OPTIONS = function($){
      var responder = that.statusman.createResponder($.req, $.res);
      return responder.OPTIONS(that._getMethods(resource));
    };
    return resource;
  });

};

Percolator.prototype = Object.create(EventEmitter.prototype);

Percolator.prototype.connectMiddleware = function(middleware){
  this.connectApp.use(middleware);
};

Percolator.prototype.defaultRequestHandler = function(req, res, handler, cb){
  var that = this;
  AuthenticateHelper(req, res, handler, function(){
    BasicAuthenticateHelper(req, res, handler, function(){
      fetchHelper(req, res, handler, function(){
        if (!!that.options.parseBody){
          req.resume();
          that.mediaTypes.connectMiddleware()(req, res, function(err){
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
              logger.error("post mediaTypes middleware error:");
              logger.error(err);
              return cb(err);
            } else {
              cb(null, context(req, res));
            }
          });
        } else {
          onbody(req, res, function(){
            req.onJson = onJsonHelper(req, res, handler, function(){
              cb(null, context(req, res));
            });
          });
        }
      });
    });
  });
};



Percolator.prototype.route = function(path, handler){
  return this.server.route(path, handler);
};

Percolator.prototype.before = function(handler){
  this.onRequestHandler = handler;
};

Percolator.prototype.after = function(f){
  this.connectMiddleware(function(req, res, next){
    res.on('finish', function(evt){
      f(req, res);
    });
    next();
  });
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

// route a directory call the callback afterward
Percolator.prototype.routeDirectory = function(directory, path, cb){
  this.server.routeDirectory(directory, path, cb);
};


// register error handlers for each content type
Percolator.prototype._assignErrorHandlers = function(){
  // tell the server about the error handlers it can use
  var statusman = this.statusman;
  var that = this;

  this.server.on414(function($){
    statusman.createResponder($.req, $.res).requestUriTooLong();
  });

  this.server.on404(function($){
    // TODO fix resource.fetch to use this handle404 instead of default!!!

    var path = that.options.resourcePath;
    var browserPath = nodePath.normalize(path + '/browser');
    var responder = statusman.createResponder($.req, $.res);
    if (that.options.browser !== false){
      hyperjsonBrowser(browserPath, path)($.req, $.res, function(){
        responder.notFound($.req.url);
      });
    } else {
      responder.notFound($.req.url);
    }
  });

  this.server.on405(function($){
    statusman.createResponder($.req, $.res).methodNotAllowed();
  });

  this.server.on501(function($){
    statusman.createResponder($.req, $.res).notImplemented();
  });

  this.server.on500(function(context, err){
    var req = context.req;
    var res = context.res;
    logger.error("===============================");
    logger.error("Uncaught Exception");
    logger.error(err);
    logger.error(req.method, ' ', req.url);
    logger.error(err.stack);
    try {
      statusman.createResponder(req, res).internalServerError();
    } catch(ex){
      logger.error("error sending 500: ", ex);
    }
  });


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
  this.registerStatusResponder('application/json',  JsonResponder);
};


Percolator.prototype.listen = function(cb){
  var that = this;
  if (!!this.staticDir){
    this.server.staticRoute(this.staticDir, function(err){
      if (!!err){
        cb("Your staticDir path could not be found.");
      }
      that.server.listen(cb);
    });
  } else {
      that.server.listen(cb);
  }
};

Percolator.prototype.close = function(cb){
  this.server.close(cb);
};


// what about body parsing based on content-type?
// example "accept only" (throws errors for unsupported types ) 
//   onBody(['application/json', application/xml'], function(err, type, body){ ... });
// example "accept all types"
//   onBody(function(err, type, body){ ... });
// TODO: max-size parameter?
// TODO: whether parseBody is true or not, we should use the same handler either way.


module.exports = Percolator;


function context(req, res){
  return {req : req, res : res};
}
