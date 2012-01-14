const express = require('express');
const should = require('should');
const Router = require('../Router').Router;
const hottap = require('hottap').hottap;


describe('Router', function(){
    it ("throws an exception when the resource directory doesn't exist", function(done){
      this.timeout(10000);
      var app = express.createServer();
      try {
        var router = new Router(app, 'http://asdf.com', './no_dir_by_this_name')
        should.fail("expected exception was not thrown");
      } catch (err){
        err.should.equal('resource_dir parameter was not a valid directory: ./no_dir_by_this_name');
        done();
      }
    });

    it ("throws an exception if a resource file doesn't export a handler");

    it ("responds with a 200 and body for simple GET", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, 'http://localhost:1337/', __dirname + '/../test_fixtures/resources')
      app.listen(1337, function(){
        hottap("http://localhost:1337/happy").request("GET", function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          should.exist(router.routes)
          result.status.should.equal(200)
          result.body.should.equal("this worked")
          done();
        });
      });
    });

    it ("responds with the Allow header for a simple OPTIONS", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, 'http://localhost:1337/', __dirname + '/../test_fixtures/resources')
      app.listen(1337, function(){
        hottap("http://localhost:1337/happy").request("OPTIONS", function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          should.exist(router.routes)
          result.status.should.equal(200)
          should.exist(result.headers['allow'])
          result.headers['allow'].should.equal("GET")
          done();
        });
      });
    });

    it ("responds with the Allow header for OPTIONS on a multi-method resource", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, 'http://localhost:1337/', __dirname + '/../test_fixtures/resources')
      app.listen(1337, function(){
        hottap("http://localhost:1337/artists").request("OPTIONS", function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          should.exist(router.routes)
          result.status.should.equal(200)
          should.exist(result.headers['allow'])
          result.headers['allow'].should.equal("GET,POST")
          done();
        });
      });
    });
    it ("responds with 405 when method not implemented by the handler", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, 'http://localhost:1337/', __dirname + '/../test_fixtures/resources')
      app.listen(1337, function(){
        hottap("http://localhost:1337/happy").request("POST", {}, '', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          should.exist(router.routes)
          result.status.should.equal(405)
          result.headers.allow.should.equal("GET")
          done();
        });
      });
    });

});
