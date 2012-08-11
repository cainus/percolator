//var fs = require('fs');
var Router = require('detour').Router;
var Reaper = require('reaper').Reaper;
var UriUtil = require('./uriUtil').UriUtil;
var express = require('express');
var StatusManager = require('./StatusManager').StatusManager;
var JsonResponder = require('./StatusManager').JsonResponder;
var _ = require('underscore');

Percolator = function(options){
  this.statusman = new StatusManager();
  this.options = options;
  this.mediaTypes = new Reaper();
  this.port = options.port || 80;
  this.protocol = options.protocol || 'http';
  var protocol = this.protocol;
  this.resourceDir = options.resourceDir || './resources';
  this.resourcePath = options.resourcePath || '/api';
  this.staticDir = options.staticDir || './static';
  this.options = _.extend(options,
                             {port : this.port,
                              protocol : this.protocol,
                              resourcePath : this.resourcePath,
                              staticDir : this.staticDir,
                              resourceDir : this.resourceDir});
  this.router = new Router(this.resourcePath);
  var router = this.router;
  this.router.onRequest = function(handler, req, res, cb){
    handler.uri = new UriUtil(router, req.url, protocol, req.headers.host);
    cb(null, handler);
  };
  this.assignErrorHandlers();
  this.registerMediaTypes();
  var that = this;
  this.server = express.createServer();
  this.router.on("route", function(resource){
    that.decorateResource(resource);
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

Percolator.prototype.setRepresenterMethod = function(resource){
  // set repr() for all resources
  var mediaTypes = this.mediaTypes;
  resource.repr = function(req, res, data){
    // TODO what if request.headers.accept isn't set at all??
    console.log('mediaTypes: ', mediaTypes);
    var obj = mediaTypes.out(req.headers.accept, data);
    res.setHeader('content-type', obj.type);
    res.send(obj.content);
  };
};

Percolator.prototype.setStatusMethod = function(resource){
  // set status() object for all resources
  var that = this;
  resource.status = function(req, res){
    return that.statusman.createResponder(req, res);
  };
};

Percolator.prototype.setOptionsHandler = function(resource){
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


Percolator.prototype.decorateResource = function(resource){

  resource.router = this.router;
  this.setOptionsHandler(resource);
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
    console.log(abs);
    return abs;
  };
  this.setRepresenterMethod(resource);
  this.setStatusMethod(resource);

};

// register error handlers for each content type
Percolator.prototype.assignErrorHandlers = function(){
  // tell the router about the error handlers it can use
  var statusman = this.statusman;
  var router = this.router;

  router.handle414 = function(req, res){
    statusman.createResponder(req, res).requestUriTooLong();
  };

  router.handle404 = function(req, res){
    // TODO fix resource.fetch to use this handle404 instead of default!!!
    var responder = statusman.createResponder(req, res);
    responder.notFound();
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
    statusman.createResponder(req, res).internalServer();
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
  this.server.use(middleware);
};

Percolator.prototype.listen = function(port, cb){
  this.use(this.router.connectMiddleware);
  this.server.listen(port, cb);
};

module.exports = Percolator;
