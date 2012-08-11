var _ = require('underscore');
var Percolator = require('./percolator');
var express = require('express');

// TODO collections proof-of-concept - POST, PUT, DELETE
// TODO make status man do conneg
// TODO producers of app/json should respond to requests for app/blah+json
// TODO res and req on the resource object itself (and not passed in?)
// TODO get a specific mediatype in there
// TODO don't use in/out for mediatype handlers
// == low priority ==
// TODO better error output when there's an error in mediaTypes, resources, etc.
// TODO how to put content-type in links
// TODO form post for create
// TODO better errors when you try to getUrl an unknown route
// TODO better way to see all routes


var app = {
  protocol : 'http',
  resourceDir : __dirname + '/test/test_fixtures/resources',
  resourcePath : '/api',
  staticDir : __dirname + '/static',
  port : 8080
};
var server = new Percolator(app);

server.use(express.favicon());
server.use(express['static'](app.staticDir));
server.use(express.bodyParser());
server.use(function(req, res, next){
  console.log(req.method, ' ', req.url);
  next();
});

server.routeDirectory(app.resourceDir, function(err){
  console.log("routing resources in " + app.resourceDir);
  if (err) {
    console.log("Routing error");
    console.log(err);
    return;
  }
  server.listen(app.port, function(err){
    if (err) {console.log(err);throw err;}
    console.log('Percolator running on ' + app.port);
  });
});
