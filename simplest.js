var Percolator = require('./percolator');

var server = new Percolator();
server.router.route('/', {  GET : function(req, res){
                              res.end("Hello World!");
                            }});
server.listen(function(err){
  console.log('server is listening on port ', server.port);
});
