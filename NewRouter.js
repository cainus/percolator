const Representer = require('./Representer').Representer;
const fs = require('fs');
const _ = require('underscore');

function Router(app, resourceDirectory){
  this.representer = new Representer();
  this.resourceDirectory = resourceDirectory;
  this.app = app;
  this.resourceTree = {}
  this.available = false;
  this.app_methods = {"GET" : "get", 
                      "POST" : "post", 
                      "DELETE" : "del", 
                      "PUT" : "put",
                      "OPTIONS" : "options"
                      };
}

Router.prototype.initialize = function(cb){
  var router = this;
  this.loadResourceTree(function(err){
    if (!!err) return cb(err);
    router.available = true;
    router.app.use(function(req, res, next){ return router.handleRequest(req, res, next)})
    var root_uri = '/';
    router.generateRoutes(root_uri);
    cb();
  });
}

Router.prototype.generateRoutes = function(root_uri){
  var router = this;
  var root_resources = [];
  _.each(this.resourceTree['/'], function(resourceName){
    root_resources.push(resourceName);
    var filePath = router.resourceDirectory + '/' + resourceName;
    var resourceHandler = require(filePath).handler
    router.setRouteHandlers('/' + resourceName, resourceHandler);
  });
  this.setRouteHandlers('/', this.getServiceDocumentHandler('/'))
  router.app.use(function(req, res, next){ return router.errorNotFound(req, res)})
}

Router.prototype.setRouteHandlers = function(resourcePath, resourceHandler){
  var router = this;
  var handlerDefault = function(q, s){
                        // default to method not allowed
                        router.errorMethodNotAllowed(q, s)
                      }
  var allowed_methods = [];
  _.each(router.app_methods, function(functionName, http_method){
    if (http_method == "OPTIONS") return;
    if (!!resourceHandler[http_method]){
      allowed_methods.push(http_method)
      var handler = resourceHandler[http_method]
    } else {
      var handler = handlerDefault;
    }
    router.setRouteHandler(http_method, resourcePath, handler);
  })
  router.setRouteHandler("OPTIONS", resourcePath, function(req, res){
    res.header('Allow', allowed_methods.join(","));
    res.send(router.representer.options(allowed_methods));
  })

}

Router.prototype.setRouteHandler = function(method, path, handler){
  var app_method = this.app_methods[method]
  this.app[app_method](path, handler)
}

Router.prototype.loadResourceTree = function(cb){
  try {
    this.validateResourceDirectory();
  } catch (ex) {
    return cb(ex);
  }
  var router = this;
  fs.readdir(this.resourceDirectory, function(err, files){
    var resources = [];
    _.each(files, function(file){
      if (endsWith(file, ".js")) {
        resources.push(file.substring(0, file.length - 3));
      };
    });
    router.resourceTree['/'] = resources;
    cb(null);
  });
};

Router.prototype.getServiceDocumentHandler = function(path){
  var serviceDoc = this.representer.individual({}, {'self' : path})
  return {
    'GET' : function(req, res){ res.send(serviceDoc); }
  }
}


Router.prototype.validateResourceDirectory =function(){
  var dir = this.resourceDirectory
  try {
    var stats = fs.lstatSync(dir);
  } catch (err){
    if (err.code == 'ENOENT'){
      throw "resource_dir parameter was not a valid directory: " + dir
    } else {
      throw err;
    }
  }
  if (!stats.isDirectory()){
    throw "resource_dir parameter was not a valid directory: " + dir
  }
}


Router.prototype.handleRequest = function(req, res, next){
  if (!this.available){
    return this.errorServerUnavailable(req, res)
  }
  //return this.errorNotFound(req, res);
  return next();
}

Router.prototype.errorServerUnavailable = function(req, res){
  var error_representation = this.representer.error("ServerUnavailable", "The server is currently offline.")
  res.send(error_representation, 503);
}

Router.prototype.errorNotFound = function(req, res){
  var error_representation = this.representer.error("NotFound", "There is no resource with the provided URI.", req.originalUrl)
  res.send(error_representation, 404);
}

Router.prototype.errorMethodNotAllowed = function(req, res){
  var error_representation = this.representer.error("MethodNotAllowed", "That method is not allowed for this resource.", req.method)
  res.send(error_representation, 405);
}

exports.Router = Router;

// -- util

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
