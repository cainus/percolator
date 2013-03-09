var Percolator = require('./index').Percolator;

var server = new Percolator();
server.route('/', function(req, res){
                  res.object({hello : "world!"})
                   .send();
                  });
server.listen(function(err){
	if (err) { throw err; }
	console.log("Percolator is listening on port ", server.port);	
});
