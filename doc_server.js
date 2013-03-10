//var _ = require('underscore');
var Percolator = require('./index').Percolator;


var app = {
  staticDir : __dirname + '/docs',
  resourcePath : '/api',
  port : process.env.PORT || 5000
};
var server = new Percolator(app);
server.before(function(req, res, handler, cb){
  // output method and url for each request
  console.log(req.method, req.url);
  cb(req, res);
});

server.routeDirectory(__dirname + '/resources', app.resourcePath, function(err){
  if (err) {console.dir(err);throw err;}
  server.listen(function(err){
    console.log('Percolator running on ' + server.port);
  });
});

