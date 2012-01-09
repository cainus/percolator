const express = require('express');
const fs = require('fs');
const _ = require('./underscore-min');
const mongoose = require('mongoose');
const fullBodyParser = require('./fullBodyParser');


function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var app = express.createServer();

app.configure(function(){
  app.use(fullBodyParser());
});              

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
        routes[resource] = require('./resources/' + resource).handler
        app.get('/' + resource, function(req, res){
          routes[resource].collectionGET(req, res);
        });

        app.post('/' + resource, function(req, res){
          routes[resource].collectionPOST(req, res);
        });

        app.get('/' + resource + '/:id', function(req, res){
          routes[resource].GET(req, res);
        });

        app.put('/' + resource + '/:id', function(req, res){
          routes[resource].PUT(req, res);
        });

        app.del('/' + resource + '/:id', function(req, res){
          routes[resource].DELETE(req, res);
        });
      });
    });
}
setRoutes();

app.get('/', function(req, res){
  var serviceDocument = { links: { self: { href: "http://localhost:3000/" }}};
  _.each(routes, function(module, resource){
    serviceDocument.links[resource] = {href : "http://localhost:3000/" + resource}
  });
  res.send(serviceDocument);
});


var mongo_url = 'mongodb://127.0.0.1:27017/percolator';
console.log('------------------------------------');
console.log('mongo_url: ' + mongo_url);
var db = mongoose.connect(mongo_url)

app.listen(3000);