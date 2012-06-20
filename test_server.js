var _ = require('underscore');
var Percolator = require('./percolator').Percolator;

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

var server;


// PERCOLATOR: protocol and port

// TODO what if you want to do more with express?

var resourceDir = __dirname + '/test/test_fixtures/resources';
console.log("routing resources in " + resourceDir);

var app = {
  protocol : 'http',
  resourceDir : resourceDir,
  resourcePath : '/api',
  staticDir : __dirname + '/static',
  port : 8080
};
var $P = new Percolator(app);

$P.expressStart(function(err){
  if (err) {console.log(err);throw err;}
  console.log('Percolator running on ' + $P.port);
});

