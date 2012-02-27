const express = require('express');
const should = require('should');
const Router = require('../NewRouter').Router;
const hottap = require('hottap').hottap;
const _ = require('underscore');


describe('Router', function(){
    it ("returns an exception when the resource directory doesn't exist", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/no_dir_by_this_name')
      router.initialize(function(err){
        err.should.equal('resource_dir parameter was not a valid directory: /home/cainus/percolator/test/../test_fixtures/no_dir_by_this_name');
        done();
      })
    });

    it ("responds with a 503 if the server is marked as unavailable", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      //var router = new Router(app, 'http://localhost:1337/api', __dirname + '/../test_fixtures/resources', 'api')
      router.initialize(function(){
        router.available = false;
        app.listen(1337, function(){
          hottap("http://localhost:1337/").request("GET", function(err, result){
            app.close();
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(503)
            JSON.parse(result.body).error.type.should.equal("ServerUnavailable")
            JSON.parse(result.body).error.message.should.equal("The server is currently offline.")
            done();
          });
        });
      });
    });


    it ("responds with a 404 if the resource is entirely unknown", function(done){
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(1338, function(){
          hottap("http://localhost:1338/doesnotexist").request("GET", function(err, result){
            app.close();
            result.status.should.equal(404)
            JSON.parse(result.body).error.type.should.equal("NotFound")
            JSON.parse(result.body).error.message.should.equal("There is no resource with the provided URI.")
            JSON.parse(result.body).error.detail.should.equal('/doesnotexist')
            done();
          });
        });
      });
    });

    it ("creates a route tree", function(done){
      // TODO make this dive into deeper dirs for nested resources!
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(err){
        _.difference( router.resourceTree['/'], ['cars', 'happy', 'artists', 'empty']).length.should.equal(0)
        done();
      });
    })

    it ("responds with a 200 if the resource exists and method is implemented", function(done){
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(1337, function(){
          hottap("http://localhost:1337/happy").request("GET", function(err, result){
            app.close();
            result.status.should.equal(200)
            result.body.should.equal("this worked")
            done();
          });
        });
      });
    });

    it ("responds with a 405 if the resource exists but the method is disallowed", function(done){
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(err){
        if (!!err){ throw err;}
        app.listen(1338, function(){
          hottap("http://localhost:1338/happy").request("POST", function(err, result){
            app.close();
            result.status.should.equal(405)
            JSON.parse(result.body).error.type.should.equal("MethodNotAllowed")
            JSON.parse(result.body).error.message.should.equal("That method is not allowed for this resource.")
            JSON.parse(result.body).error.detail.should.equal('POST')
            done();
          });
        });
      });
    });

    it ("responds with the Allow header for a simple OPTIONS", function(done){
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(1337, function(){
          hottap("http://localhost:1337/happy").request("OPTIONS", function(err, result){
            app.close();
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(200)
            should.exist(result.headers['allow'])
            result.headers['allow'].should.equal("GET")
            JSON.parse(result.body)['Allowed'][0].should.equal("GET")
            JSON.parse(result.body)['Allowed'].length.should.equal(1)
            done();
          });
        });
      });
    });

    it ("responds with a service document when the root is requested", function(done){
      var app = express.createServer();
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(1337, function(){
          hottap("http://localhost:1337/").request("GET", function(err, result){
            app.close();
            result.status.should.equal(200)
            // TODO check links here
            done();
          });
        });
      });
    })
/*
    it ("sets up collection routes", function(done){
      should.fail('not implemented')
    });

*/
});
