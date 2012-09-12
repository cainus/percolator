var Router = require('detour').Router;
var Reaper = require('reaper').Reaper;
var UriUtil = require('./uriUtil').UriUtil;
var connect = require('connect');
var http = require('http');
var https = require('https');
var EventEmitter = require('events').EventEmitter;
var StatusManager = require('./StatusManager').StatusManager;
var JsonResponder = require('./JsonResponder');
var fetchContextHelper = require('./ContextHelpers/Fetch');
var authenticateContextHelper = require('./ContextHelpers/Authenticate');
var bodyContextHelper = require('./ContextHelpers/Body');
var _ = require('underscore');
var fs = require('fs');

/*

public interface?
.route()
.routeDirectory()
.use()
.listen()
.close()

*/

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
  if (!!options.staticDir){
    this.staticDir = options.staticDir;
  }
  this.router = new Router(this.resourcePath);
  var router = this.router;
  var protocol = this.protocol;
  var that = this;
  this.statusman = new StatusManager();
  this.statusman.on('error', function(errorObject){
    that.emit("errorResponse", errorObject);
  });
  this.mediaTypes = new Reaper();
  this.onRequestHandler = function(context, cb){
    cb(context);  // do nothing with it by default
  };
  this.router.onRequest = function(handler, cb){ // TODO detour should send a context and a handler
    var req = handler.req;
    var res = handler.res;
    var context = { req : req , res : res };
    context.app = that.options;
    context.router = router;
    context.uri = new UriUtil(router, req.url, protocol, req.headers.host);
    context.status = that.statusman.createResponder(req, res);
    context.repr = that._getRepr(req, res);
    handler.req = req;
    handler.res = res;
    that.onRequestHandler(context, function(context){
      handler = _.extend(context, handler); // TODO don't mash these together!
      that.defaultContextHandler(context, handler, cb);
    });
  };
  this._assignErrorHandlers();
  this.registerMediaTypes();
  this.middlewareManager = connect();

  // TODO TDD:  accept stuff won't work any more due to no more connect
  this.middlewareManager.use(function(req, res, next){
    var accept = req.headers.accept || '*/*';
    if (!that.mediaTypes.isAcceptable(accept)){
      that.statusman.createResponder(req, res).notAcceptable();
    } else {
      return next();
    }
  });
  this.router.on("route", function(resource){
    // TODO regression?  there's no more route event.
    // set the OPTIONS method at route-time, so the router won't 405 it.
    that._setOptionsHandler(resource);
  });
};

Percolator.prototype = Object.create(EventEmitter.prototype);

// TODO better name?
Percolator.prototype.defaultContextHandler = function(context, handler, cb){
  var that = this;
  var req = context.req;
  var res = context.res;
  authenticateContextHelper(context, handler, function(){
    fetchContextHelper(context, handler, function(){
      if (!!that.options.parseBody){
        that.mediaTypes.connectMiddleware(context)(req, res, function(err){
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
        handler.onBody = bodyContextHelper(context, handler, function(){
          cb(null, handler);
        });
      }
    });
  });
};



Percolator.prototype.route = function(path, handler){
  this.router.route(path, handler);
};

Percolator.prototype.onRequest = function(handler){
  this.onRequestHandler = handler;
};


// TODO kinda sucks.  kill meeeeeeeeeeeeee.
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

// TODO:  better as a pre-route middleware? contextHelper? something else?
Percolator.prototype._setOptionsHandler = function(resource){
  // tell each resource how to respond to OPTIONS
    var that = this;
    resource.OPTIONS = function($){
      var responder = that.statusman.createResponder($.req, $.res);
      return responder.OPTIONS(that._getMethods(resource));
    };

};

// run the directory router and call the callback afterward
Percolator.prototype.routeDirectory = function(directory, cb){
  this.router.routeDirectory(directory, cb);
};


// register error handlers for each content type
Percolator.prototype._assignErrorHandlers = function(){
  // tell the router about the error handlers it can use
  var statusman = this.statusman;
  var router = this.router;

  // TODO TDD! change this to on414 and make the callback take a context instead!
  router.handle414 = function(req, res){
    statusman.createResponder(req, res).requestUriTooLong();
  };

  router.on404(function($){
    // TODO TDD! fix resource.fetch to use this handle404 instead of default!!!
    var responder = statusman.createResponder($.req, $.res);
    responder.notFound($.req.url);
  });

  // TODO TDD! change this to on405 and make the callback take a context instead!
  router.handle405 = function(req, res){
    statusman.createResponder(req, res).methodNotAllowed();
  };

  // TODO TDD! change this to on501 and make the callback take a context instead!
  router.handle501 = function(req, res){
    statusman.createResponder(req, res).notImplemented();
  };

  router.on500(function(context, ex){
    console.log("===============================");
    console.log("Uncaught Exception");
    console.log(ex);
    console.log(context.req.method, ' ', context.req.url);
    console.log(ex.stack);
    statusman.createResponder(context.req, context.res).internalServerError();
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
  //var xmlType = require('./mediaTypes/xml');
  // this.registerMediaType('application/xml', xmlType.in, xmlType.out);

  this.registerStatusResponder('application/json',  JsonResponder);

};


function ensureStaticDir(dir, cb){
  if (dir){
    fs.exists(dir, function(exists){
      if (!exists){
        return cb("Your staticDir path could not be found.");
      } else {
        return cb();
      }
    });
  } else {
    return cb();
  }
}
Percolator.prototype.listen = function(cb){
  var that = this;
  var router = this.router;
  var protocolLibrary = this.protocol === 'https' ? https : http;
  ensureStaticDir(that.staticDir, function(err){
    if (!!err) {
      return cb(err);
    } else {
      var server = protocolLibrary.createServer(function(req, res){
        if (!!that.staticDir){
          connect['static'](that.staticDir)(req, res, function(){
            router.dispatch({req : req, res : res});
          });
        } else {
          router.dispatch({req : req, res : res});
        }
      });
      server.listen(that.port, cb);
      that.server = server;
    }
  });
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
// TODO: reaper kind of sucks.


module.exports = Percolator;
