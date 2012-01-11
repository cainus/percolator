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

function setRoute(app, resource_name, http_method, is_sub_resource, handler){
        var app_method = {"GET" : "get", "POST" : "post", "DELETE" : "del", "PUT" : "put"}[http_method];
        if (is_sub_resource){
          var handler_method = http_method 
          var path = '/' + resource_name + '/:id';
        } else {
          var handler_method = 'collection' + http_method;
          var path = '/' + resource_name
        }
        if (!!handler[handler_method]){
          app[app_method](path, function(req, res){
            handler[handler_method](req, res);
          });
        } else {
          app[app_method](path, function(req, res){
            res.send('', 405);
          });
        }

}

function Router(app, base_url, resource_dir){
  this.resource_dir = resource_dir
  check_directory(this.resource_dir);
  this.base_url = base_url
  var obj = this;
    function Router_getResources(cb){
      // TODO : there can't be resources named parent, self, etc.
      fs.readdir(obj.resource_dir, function(err, files){
        var resources = [];
        _.each(files, function(file){
          if (endsWith(file, ".js")) {
            resources.push(file.substring(0, file.length - 3));
          };
        });
        cb(resources);
      });
    };
    this.routes = {}
    Router_getResources(function(resources){
      console.log(resources);
      _.each(resources, function(resource){
        obj.routes[resource] = require(obj.resource_dir + '/' + resource).handler
        setRoute(app, resource, 'GET', false, obj.routes[resource]);
        setRoute(app, resource, 'GET', true, obj.routes[resource]);
      });
      app.get('/', function(req, res){
        var serviceDocument = { links: { self: { href: obj.base_url }}};
        _.each(obj.routes, function(module, resource){
          serviceDocument.links[resource] = {href : obj.base_url + resource}
        });
        res.send(serviceDocument);
      });

    });
}
exports.Router = Router;
