const express = require('express');
const fs = require('fs');
const _ = require('./underscore-min');


function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var app = express.createServer();
              

function getResources(cb){
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

var routes = {};
function setRoutes(){
    getResources(function(resources){
      _.each(resources, function(resource){
        routes[resource] = require('./resources/' + resource)
        app.get('/' + resource, function(req, res){
          routes[resource].collectionGET(req, res);
        });

        app.get('/' + resource + '/:id', function(req, res){
          routes[resource].GET(req, res);
        });
      });
    });
}
setRoutes();

app.get('/', function(req, res){
  var serviceDocument = { links: { self: { href: "/" }}};
  _.each(routes, function(module, resource){
    serviceDocument.links[resource] = {href : "/" + resource}
  });
  res.send(serviceDocument);
});

app.listen(3000);