var should = require('should');
var Percolator = require('../../index').Percolator;
var BasicAuthenticateHelper = require('../../index').BasicAuthenticateHelper;
var hottap = require('hottap').hottap;
var request = require('request');
var _ = require('underscore');
var urls = [];
var jobNumber = process.env.TRAVIS_JOB_NUMBER || '0.0';
var port = 7000 + parseInt(jobNumber.split(".")[1], 10);

describe("Percolator", function(){
	before(function(done){

		var app = {
			protocol : 'http',
			resourcePath : '/api',
			staticDir : __dirname + '/../test_fixtures/static',
			port : port
		};

		/*
		app.artists = {
			1 : {"name" : "Neil Young", created : new Date()},
			2 : {"name" : "Joe Strummer", created : new Date()}
		};


		app.teas = [{name : "Earl Grey"}, {name : "Orange Pekoe"}, {name : "Lemon Zinger"}, {name : "English Breakfast"}];
		app.teas = _.map(app.teas, function(tea){ tea.created = new Date(); return tea; });
		*/

		var server = new Percolator(app);
		server.before(function(req, res, handler, cb){
			req.started = new Date();
			BasicAuthenticateHelper(req, res, handler, function(){
				cb();
			});
		});

		server.after(function(req, res, handler){
			console.log(' <-- ', req.method, ' ', req.url, ' | duration: ' + (new Date() - req.started) + ' ms');
		});

		var resourceDir = __dirname + '/../test_fixtures/resources';
		server.routeDirectory(resourceDir, app.resourcePath, function(err){
			console.log("routed resources in " + resourceDir);

			server.connectMiddleware(function(req, res, done){
				urls.push(req.url);
				done();
			});

			server.route('/inside', 
													{ GET : function(req, res){ 
																		res.end("muahahah!"); 
																	}
													});
			server.route('/someProtectedPath', {
				basicAuthenticate : function(username, password, req, res, cb){
					// try to get the user here, based on cookie, Authentication header, etc
					if (username === 'Pierre' && password === 'Collateur'){
						return cb(null, {username : "Pierre", twitter_handle : "@Percolator"});
						// user object will be available in req.authenticated in all methods
					} else {
						return cb(true);  // Percolator will 401 for you
					}
				},
				GET : function(req, res){
					res.object({youAre : req.authenticated}).send();
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
				done();
			});
		});

	});
	
	// this should work in 0.10 
	// as per https://groups.google.com/forum/?fromgroups=#!topic/nodejs/n-W9BSfxCjI
  xit ("can catch an uncaught exception and 500", function(done){
		process._fatalException = function(err) {console.log('here', err.stack);};
		var failUrl = "http://localhost:" + port + "/api/fail";
		hottap(failUrl).request("GET", function(err, response){
			//should.not.exist(err);
			//JSON.parse(response.body).should.eql({});
      done();
		});
  });

  it ("has basic authentication support", function(done){
    request({url : 'http://localhost:' + port + '/api/restricted', auth : {username : 'login', password : 'password'}}, function(err, response, body){
      should.not.exist(err);
      JSON.parse(body).accessGranted.should.equal(true);
      done();
    });
  });

  it ("can support connectMiddleware", function(done){
		hottap('http://localhost:' + port + '/api').request("GET", function(err, response){
			_.last(urls).should.equal('/api');
			done();
		});
  });
});
