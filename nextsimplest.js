var Percolator = require('./percolator');

var server = new Percolator();
server.routeDirectory(__dirname + '/resources', function(err){
  if (!!err) {console.log(err);}
  server.listen(function(err){
    console.log('server is listening on port ', server.port);
  });
});
