const JsonRepresenter = require('./representers/JsonRepresenter').JsonRepresenter;
const ResourceTree = require('./ResourceTree').ResourceTree;
const _ = require('underscore');
const fullBodyParser = require('./middleware/fullBodyParser');
const jsonBodyParser = require('./middleware/jsonBodyParser');

// TODO : HEAD method?  Can we just call GET and return an empty doc?

function Router(app, resourceDirectory, base_uri){
  this.representer = new JsonRepresenter();
  var representer = this.representer;
  this.resourceDirectory = resourceDirectory;
  this.app = app;
  if (base_uri == '') base_uri = null;
  this.base_uri = base_uri || '/';
  this.resourceTree = {}
  this.available = false;
  this.app_methods = {"GET" : "get", 
                      "POST" : "post", 
                      "DELETE" : "del", 
                      "PUT" : "put",
                      };
  this.app.use(function(req, res, next){
    res.error = {"send" :
                    function(code, type, message, detail){
                      var error_representation = representer.error(type, message, detail)
                      res.send(error_representation, code)
                    }
                }
    return next()
  })
  this.app.use(fullBodyParser());
  this.app.use(jsonBodyParser());
  var router = this;
  this.app.use(function(req, res, next){ return router.handleRequest(req, res, next)})
  this.loadResourceTree();
  this.generateRoutes();
  this.available = true;
}


Router.prototype.setRouteForNode = function(urlPrefixPath, filePrefixPath, node){
    var router = this;
    var resourceName = node.path;
    var filePath = urlJoin(filePrefixPath, resourceName);

    var resourceHandler = require(filePath).handler
    node.module = resourceHandler;
    var routeString = urlJoin(router.base_uri, urlPrefixPath, resourceName)
    var isCollection = router.handlerIsCollection(resourceHandler);
    router.setRouteHandlers(routeString, resourceHandler);
    // recurse!
    if (isCollection){
      var newUrlPrefixPath = urlJoin(urlPrefixPath, node.path, ':' + node.path + '_id');
    } else {
      var newUrlPrefixPath = urlJoin(urlPrefixPath, node.path);
    }
    var newFilePrefixPath = urlJoin(filePrefixPath, node.path);
    _.each(node.children, function(kid){
      router.setRouteForNode(newUrlPrefixPath, newFilePrefixPath, kid);
    });
}

Router.prototype.generateRoutes = function(){
  var router = this;
  router.setServiceDocumentRoute()
  _.each(this.resourceTree.children, function(node){
    router.setRouteForNode('', router.resourceDirectory, node)
  });
  router.app.use(function(req, res, next){ return router.errorNotFound(req, res)})
}


Router.prototype.setServiceDocumentRoute = function(){
  var root_resources = _.pluck(this.resourceTree.children, 'path');
  var serviceDocHandler = this.representer.serviceDocument(this.base_uri, root_resources)
  this.setRouteHandlers(this.base_uri, serviceDocHandler)
  var base_uri_without_slash = this.base_uri.substring(0, this.base_uri.length - 1);
  if (base_uri_without_slash != ""){
    this.setRouteHandlers(base_uri_without_slash, serviceDocHandler)
  }

}

Router.prototype.setRouteHandlers = function(resourcePath, resourceHandler){
  var router = this;
  var isCollection = router.handlerIsCollection(resourceHandler);

  // set GET, POST, PUT, DELETE for this resource file
  if (isCollection){
    _.each(router.app_methods, function(functionName, http_method){
      router._routeToMethodHandler(resourcePath, resourceHandler, http_method, 'collection');
      router._routeToMethodHandler(urlJoin(resourcePath, ':id') , resourceHandler, http_method);
    })
  } else {
    _.each(router.app_methods, function(functionName, http_method){
      router._routeToMethodHandler(resourcePath, resourceHandler, http_method);
    })
  }

  // set OPTIONS for this resource
  if (isCollection){
    this._setOptionsHandler(resourceHandler, resourcePath, true);
    this._setOptionsHandler(resourceHandler, urlJoin(resourcePath, ':id'), false);
  } else {
    this._setOptionsHandler(resourceHandler, resourcePath, false);
  }
}

Router.prototype._routeToMethodHandler = function(resourcePath, resourceHandler, httpMethod, methodPrefix){
    var router = this;
    var methodPrefix = methodPrefix || ''
    var handlerDefault = function(q, s){
                        // default to method not allowed
                        router.errorMethodNotAllowed(q, s)
                      }
    var resourceMethod = methodPrefix + httpMethod;
    if (!!resourceHandler[resourceMethod]){
      var handler = function(q, s){resourceHandler[resourceMethod](q, s)}
    } else {
      var handler = handlerDefault;
    }
    this.setRouteHandler(httpMethod, resourcePath, handler);
}

Router.prototype._setOptionsHandler = function(resourceHandler, resourcePath, isCollection){
  var allowed_methods = [];
  var router = this;
  _.each(router.app_methods, function(functionName, httpMethod){
    var handlerMethod = (isCollection) ? ("collection" + httpMethod) : httpMethod;
    if (!!resourceHandler[handlerMethod]){
      allowed_methods.push(httpMethod)
    }
  });
  this.setRouteHandler("OPTIONS", resourcePath, function(req, res){
    res.header('Allow', allowed_methods.join(","));
    res.send(router.representer.options(allowed_methods));
  })
}

Router.prototype.handlerIsCollection = function(handler){
  // if any collection method is set, it's a collection
  return _.any(_.keys(this.app_methods), function(method){
    return !!handler["collection" + method]
  });
}

Router.prototype.setRouteHandler = function(http_method, path, handler){
  var methods = _.clone(this.app_methods)
  methods["OPTIONS"] = 'options'
  var app_method = methods[http_method]
  var representer = this.representer
  var representerMiddleware = function(req, res, next){
    // TODO add autolinks to parent, self, and children
    res.representer = Object.create(representer);
    res.representer.links = {}
    res.representer.links.parent = {href : parentDir(req.originalUrl)}
    res.representer.links.self = {href : req.originalUrl}
    // TODO loop through any children, adding them.  (can serviceDocument be killed?)
    // TODO add tests for this stuff!!!
    res.show = function(resourceObject, links){
      var links = links || {}
      links = _.extend(links, res.representer.links);
      if( Object.prototype.toString.call( resourceObject ) === '[object Array]' ) {
        res.send(res.representer.collection('items', resourceObject, links))
        // collection
      } else {
        // individual
        res.send(res.representer.individual(resourceObject, links))
      }
    }
    return next();
  }
  this.app[app_method](path, representerMiddleware, handler)
}

Router.prototype.loadResourceTree = function(){
  var tree = new ResourceTree();
  tree.fromFileSystem(this.resourceDirectory);
  this.resourceTree = tree;
};

Router.prototype.getServiceDocumentHandler = function(path, root_resources){
  var links = {'self' : path}
  _.each(root_resources, function(resource){
    links[resource] = urlJoin(path, resource);
  });
  var serviceDoc = this.representer.individual({}, links)
  return {
    'GET' : function(req, res){ res.send(serviceDoc); }
  }
}


Router.prototype.handleRequest = function(req, res, next){
  if (!this.available){
    return this.errorServerUnavailable(req, res)
  }
  if (req.originalUrl.length > 4096){
    return this.errorRequestUriTooLong(req, res)
  }
  //return this.errorNotFound(req, res);
  return next();
}

Router.prototype.errorServerUnavailable = function(req, res){
  res.error.send(503, "ServerUnavailable", "The server is currently offline.");
}

Router.prototype.errorNotFound = function(req, res){
  res.error.send(404, "NotFound", "There is no resource with the provided URI.", req.originalUrl)
}

Router.prototype.errorRequestUriTooLong = function(req, res){
  res.error.send(414, "RequestUriTooLong", "The provided URI is too long.", req.originalUrl)
}

Router.prototype.errorMethodNotAllowed = function(req, res){
  res.error.send(405, "MethodNotAllowed", "That method is not allowed for this resource.", req.method)
}

exports.Router = Router;

// -- util

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function urlJoin(){
  var joined =_.toArray(arguments).join('/').replace(/\/+/g, '/')  // put a fwd-slash between all pieces and remove any redundant slashes
  return joined;
}

function parentDir(path){
  if (path[path.length - 1] == '/'){
    path = path.substring(0, path.length -1);
  }
  return _.initial(path.split("/")).join("/")
}
