const _ = require('./underscore-min');
const fs = require('fs');
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function check_directory(dir){
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

function setAllowHeader(res, route, is_sub_resource){
  res.header('Allow', route.get_allowed_methods(is_sub_resource).join(","));
}

function attachMethod(app, http_method, is_sub_resource, route){
    var app_method = {"GET" : "get", 
                      "POST" : "post", 
                      "DELETE" : "del", 
                      "PUT" : "put", 
                      "OPTIONS" : "options"}[http_method];
    if (is_sub_resource){
      var handler_method = http_method 
      var path = '/' + route.resource_name + '/:id';
    } else {
      var handler_method = 'collection' + http_method;
      var path = '/' + route.resource_name
    }
    var handler = route.module;
    if (!!handler[handler_method]){
      route.add_allowed_method(http_method, is_sub_resource)
      app[app_method](path, function(req, res){
        handler[handler_method](req, res);
      });
    } else {
      app[app_method](path, function(req, res){
        setAllowHeader(res, route, is_sub_resource);
        res.send('', 405);
      });
    }
}



function Router_getResources(dir, cb){
  // TODO : there can't be resources named parent, self, etc.
  fs.readdir(dir, function(err, files){
    var resources = [];
    _.each(files, function(file){
      if (endsWith(file, ".js")) {
        resources.push(file.substring(0, file.length - 3));
      };
    });
    cb(resources);
  });
};


function Route(resource_name, module){
  this.resource_name = resource_name;  // the string name of the resource
  this.module = module;           // the handler object loaded from the file
  this.allowed_methods = [];      // all the methods allowed on the main resource
  this.allowed_methods_sub = [];  // all the methods allowed on the sub resource
  this.get_allowed_methods = function(is_sub_resource){
    return (is_sub_resource) ? this.allowed_methods_sub : this.allowed_methods;
  }
  this.add_allowed_method = function(method, is_sub_resource){
    this.get_allowed_methods(is_sub_resource).push(method)
    //console.log(this.toString());
  }
  this.toString = function(){
    return '[Route ' + resource_name + 
           ' Methods: ' + this.allowed_methods.join(",") +
           ' SubResource Methods: ' + this.allowed_methods_sub.join(",") + ']';
  }
}

function setDefaultOptionsHandler(app, route){
  var resource = route.resource_name
    app.options('/' + resource, function(req, res){
      setAllowHeader(res, route, false) 
      res.send('')
    });
    app.options('/' + resource + '/:id', function(req, res){
      setAllowHeader(res, route, true) 
      res.send('')
    });
}

function Router(app, base_url, resource_dir){
  this.resource_dir = resource_dir
  check_directory(this.resource_dir);
  this.base_url = base_url
  var obj = this;
  this.routes = {}

  Router_getResources(obj.resource_dir, function(resources){
      //console.log(resources);
      _.each(resources, function(resource){
        var module = require(obj.resource_dir + '/' + resource).handler
        var route = new Route(resource, module);
        obj.routes[resource] = route; 
        _.each(["GET", "POST", "PUT", "DELETE"], function(http_method){
          attachMethod(app, http_method, false, route);
          attachMethod(app, http_method, true, route);
        });
        if (route.get_allowed_methods().indexOf("OPTIONS") == -1){
          setDefaultOptionsHandler(app, route);
        }
      });
      app.get('/', function(req, res){
        var serviceDocument = { links: { self: { href: obj.base_url }}};
        _.each(obj.routes, function(route, resource){
          serviceDocument.links[resource] = {href : obj.base_url + resource}
        });
        res.send(serviceDocument);
      });

  });
}
exports.Router = Router;
