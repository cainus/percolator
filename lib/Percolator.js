var Reaper = require('reaper').Reaper;
var EventEmitter = require('events').EventEmitter;
var index = require('../index');
var JsonResponder = index.JsonResponder;
var onBodyHelper = index.onBodyHelper;
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
var urlgrey = require('urlgrey');
var connect = require('connect');


Percolator = function(options){
  this.connectApp = connect();
  options = options || {};
  this.options = options;
  this.options.port = this.options.port || 3000;
  this.options.ip = this.options.ip || '0.0.0.0';
  if (this.options.autoLink !== false){
    this.options.autoLink = true;
  }
  this.options.protocol = this.options.protocol || 'http';
  this.options.resourcePath = this.options.resourcePath || '/';
  this.options.parseBody = this.options.parseBody || false;
  this.port = this.options.port;
  this.ip = this.options.ip;
  this.protocol = this.options.protocol;
  this.resourcePath = this.options.resourcePath;
  this.server = new Server(this.ip, this.port, this.protocol, this.resourcePath);
  if (!!options.staticDir){
    this.staticDir = options.staticDir;
  }
  var protocol = this.protocol;
  var that = this;
  this.statusman = new StatusManager();
  this.statusman.on('error', function(errorObject){
    that.emit("errorResponse", errorObject);
  });
  this.mediaTypes = new Reaper();
  this.onRequestHandler = function(req, res, handler, cb){
    cb();  // do nothing with it by default
  };
  this.onResponseHandler = function(req, res, handler){
    // do nothing with it by default
  };
  this.server.onRequest(function(handler, context, cb){
    var req = context.req;
    var res = context.res;
    that.connectApp(req, res, function(){
      req.app = that.options;
      var router = that.server.router;
      req.router = router;  // TODO is there any use-case for this?  delete?
      req.uri = urlgrey(protocol + '://' + req.headers.host + req.url);
      ObjectHelper(req, res);
      res.status = that.statusman.createResponder(req, res);
      var oldEnd = res.end;
      res.end = function(data, encoding){
        oldEnd.apply(res, [data, encoding]);
        that.onResponseHandler(req, res, handler);
      };

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
  req.pause();
    AuthenticateHelper(req, res, handler, function(){
      BasicAuthenticateHelper(req, res, handler, function(){
        fetchHelper(req, res, handler, function(){
          if (!!that.options.parseBody){
            req.resume();
            var ctxt = context(req, res);
            that.mediaTypes.connectMiddleware(ctxt)(req, res, function(err){
              req.body = ctxt.body;
              req.rawBody = ctxt.rawBody;
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
                cb(null, context(req, res));
              }
            });
          } else {
            req.onBody = onBodyHelper(req, res, handler, function(){
              req.onJson = onJsonHelper(req, res, handler, function(){
                req.resume();
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

Percolator.prototype.after = function(handler){
  this.onResponseHandler = handler;
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
    var browserPath = urlgrey(path).child('browser').path().toString();
    hyperjsonBrowser(browserPath, path)($.req, $.res, function(){
      var responder = statusman.createResponder($.req, $.res);
      responder.notFound($.req.url);
    });
  });

  this.server.on405(function($){
    statusman.createResponder($.req, $.res).methodNotAllowed();
  });

  this.server.on501(function($){
    statusman.createResponder($.req, $.res).notImplemented();
  });

  this.server.on500(function(context, ex){
    var req = context.req;
    var res = context.res;
    console.log("===============================");
    console.log("Uncaught Exception");
    console.log(ex);
    console.log(req.method, ' ', req.url);
    console.log(ex.stack);
    statusman.createResponder(req, res).internalServerError();
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
