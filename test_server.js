var express = require('express');
var JsonResponder = require('./StatusManager').JsonResponder;
var _ = require('underscore');
var Percolator = require('./percolator').Percolator;

// TODO collections proof-of-concept - POST, PUT, DELETE
// TODO make status man do conneg
// TODO producers of app/json should respond to requests for app/blah+json
// TODO res and req on the resource object itself (and not passed in?)
// TODO get a specific mediatype in there
// == low priority ==
// TODO better error output when there's an error in mediaTypes, resources, etc.
// TODO how to put content-type in links
// TODO form post for create
// TODO better errors when you try to getUrl an unknown route
// TODO better way to see all routes

var server;


// PERCOLATOR: protocol and port
var app = {
  protocol : 'http'
  ,resourceDir : __dirname + '/test/test_fixtures/resources'
  ,port : 8080
}
var $P = new Percolator(app);


// PERCOLATOR: register media types
var jsonType = require('./mediaTypes/json');
$P.registerMediaType('application/json', jsonType.in, jsonType.out);
//var xmlType = require('./mediaTypes/xml');
// $P.registerMediaType('application/xml', xmlType.in, xmlType.out);

$P.registerStatusResponder('application/json',  JsonResponder);


$P.getRoutes(function(err){
  if (err) {console.log(err);throw err;}

  server = express.createServer();

  server.configure(function(){
      server.use(express.favicon());
      server.use(express.bodyParser());
      server.use(function(req, res, next){
        console.log(req.method, ' ', req.url);
        next();
      });
      server.use($P.router.connectMiddleware);
  });


  console.log($P.router);

  server.listen($P.port);
  console.log('express with detour running on ' + $P.port);

});
