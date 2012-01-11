const express = require('express');
const should = require('should');
const Router = require('../Router').Router;
const HotTap = require('../hottap').HotTap;


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

    it ("creates 405 responses for all methods that aren't implemented by the handler", function(done){
        this.timeout(10000);
        setTimeout(done, 3000);
    });
    
    it ("responds with a 200 and body for simple GET", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, 'http://localhost:1337/', __dirname + '/../test_fixtures/resources')
      app.listen(1337, function(){
        HotTap("http://localhost:1337/happy").request("GET", function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          should.exist(router.routes)
          result.status.should.equal(200)
          result.body.should.equal("this worked")
          app.close();
          done();
        });
      });
    });

    it ("responds with 405 when collection GET not implemented by the handler", function(done){
      // TODO: other methods + singular resource
      // TODO: make it return the "Allowed" methods
      this.timeout(10000);
      var app = express.createServer();
      var router = new Router(app, 'http://localhost:1337/', __dirname + '/../test_fixtures/resources')
      app.listen(1337, function(){
        HotTap("http://localhost:1337/empty").request("GET", function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          should.exist(router.routes)
          result.status.should.equal(405)
          app.close();
          done();
        });
      });
    });

});
