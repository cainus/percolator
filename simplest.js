var Percolator = require('./percolator');

var server = new Percolator();
server.route('/', {  GET : function($){
                              $.res.end("Hello World!");
                            }});
server.listen(function(err){
  console.log('server is listening on port ', server.port);
});
