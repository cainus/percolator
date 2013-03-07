var _ = require('underscore');
var Percolator = require('./index').Percolator;
var BasicAuthenticateHelper = require('./index').BasicAuthenticateHelper;

// TODO collections proof-of-concept - POST, PUT, DELETE
// TODO make status man do conneg
// TODO producers of app/json should respond to requests for app/blah+json
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
  resourcePath : '/api',
  staticDir : __dirname + '/test/test_fixtures/static',
  port : 8080
};

app.artists = {
  1 : {"name" : "Neil Young", created : new Date()},
  2 : {"name" : "Joe Strummer", created : new Date()}
};


app.teas = [{name : "Earl Grey"}, {name : "Orange Pekoe"}, {name : "Lemon Zinger"}, {name : "English Breakfast"}];
app.teas = _.map(app.teas, function(tea){ tea.created = new Date(); return tea; });

var server = new Percolator(app);
server.onRequest(function(handler, context, cb){
  console.log(' <-- ', context.req.method, ' ', context.req.url);
  // TODO context helpers take params in a different order than onRequest provides them?
  // this is confusing
  BasicAuthenticateHelper(context.req, context.res, handler, function(){
    cb(context);
  });
});

var resourceDir = __dirname + '/test/test_fixtures/resources';
server.routeDirectory(resourceDir, app.resourcePath, function(err){
  console.log("routed resources in " + resourceDir);

  server.route('/inside', 
                      { GET : function($){ 
                                $.res.end("muahahah!"); 
                              }
                      });

  if (err) {
    console.log("Routing error");
    console.log(err);
    return;
  }
  server.on("response", function(data){
    console.log("response");
    console.log(data);
  });
  server.on("errorResponse", function(data){
    console.log("error response");
    console.log(data.req.method, data.req.url, data.type, data.message, data.detail);
  });
  server.listen(function(err){
    if (err) {console.log(err);throw err;}
    console.log('Percolator running on ' + server.port);
  });
});
