const _ = require('./underscore-min');
const fs = require('fs');
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function Router(app){
    function Router_getResources(cb){
      // TODO : there can't be resources named parent, self, etc.
      fs.readdir("./resources", function(err, files){
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
    var obj = this;
    Router_getResources(function(resources){
      _.each(resources, function(resource){
        obj.routes[resource] = require('./resources/' + resource).handler
        app.get('/' + resource, function(req, res){
          obj.routes[resource].collectionGET(req, res);
        });

        app.post('/' + resource, function(req, res){
          obj.routes[resource].collectionPOST(req, res);
        });

        app.get('/' + resource + '/:id', function(req, res){
          obj.routes[resource].GET(req, res);
        });

        app.put('/' + resource + '/:id', function(req, res){
          obj.routes[resource].PUT(req, res);
        });

        app.del('/' + resource + '/:id', function(req, res){
          obj.routes[resource].DELETE(req, res);
        });
      });
      app.get('/', function(req, res){
        var serviceDocument = { links: { self: { href: "http://localhost:3000/" }}};
        _.each(obj.routes, function(module, resource){
          serviceDocument.links[resource] = {href : "http://localhost:3000/" + resource}
        });
        res.send(serviceDocument);
      });

    });
}
exports.Router = Router;
