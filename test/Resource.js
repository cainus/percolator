const Resource = require('../lib/resourceTypes/Resource').Resource;
const express = require('express');
const should = require('should');
const Router = require('../lib/Router').Router;
const hottap = require('hottap').hottap;
const _ = require('underscore');

var lastPort = 1300;
function getPort(){
  lastPort++
  return lastPort;
}

describe('Resource', function(){ 

   beforeEach(function(done){
     done();
  });


  it ("should return 422 when parameters are missing", function(done){
    var app = express.createServer();
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
    var router = new Router(app, __dirname + '/../test_fixtures/resources')
    router.initialize(function(){
      app.listen(port, function(){
        hottap("http://localhost:" + port + "/cars").request("POST", {'Content-Type' : 'application/json'}, 
          '{"hello":"world"}', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(422);
          JSON.parse(result.body).error.type.should.equal("MissingAttribute")
          JSON.parse(result.body).error.message.should.equal("The cars resource requires a property named 'make'")
          done();
        });
      });
    });
  });

  it ("should return 422 when the year is less than 1930", function(done){
    var app = express.createServer();
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
    var router = new Router(app, __dirname + '/../test_fixtures/resources')
    router.initialize(function(){
      app.listen(port, function(){
        hottap("http://localhost:" + port + "/cars").request("POST", {'Content-Type' : 'application/json'}, 
          '{"make":"Ford", "model":"Model-T", "year":"1905"}', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(422);
          JSON.parse(result.body).error.type.should.equal("InvalidAttribute")
          JSON.parse(result.body).error.message.should.equal("The cars resource requires a property named 'year' that is later than 1930")
          done();
        });
      });
    });
  });

  it ("should return 422 when an disallowed extra attribute is passed in", function(done){
    var app = express.createServer();
    var port = 1337; 
    app.settings.base_path = 'http://localhost:' + port;
    var router = new Router(app, __dirname + '/../test_fixtures/resources')
    router.initialize(function(){
      app.listen(port, function(){
        hottap("http://localhost:" + port + "/cars").request("POST", {'Content-Type' : 'application/json'}, 
          '{"make":"Ford", "model":"Model-T", "year":"1905", "color":"red"}', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(422);
          JSON.parse(result.body).error.type.should.equal("UnexpectedAttribute")
          JSON.parse(result.body).error.message.should.equal("The cars resource should not contain a property named 'color'")
          done();
        });
      });
    });
  });

  it ("should return 200 when an allowed extra attribute is passed in", function(done){
    var app = express.createServer();
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
    var router = new Router(app, __dirname + '/../test_fixtures/resources')
    router.initialize(function(){
      app.listen(port, function(){
        hottap("http://localhost:" + port + "/cars").request("POST", {'Content-Type' : 'application/json'}, 
          '{"make":"Subaru", "model":"Impreza", "year":"2005", "topSpeed":"155"}', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(200);
          done();
        });
      });
    });
  });

  it ("should return 200 when all the required attributes are passed in", function(done){
    this.timeout(10000);
    var app = express.createServer();
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
    var router = new Router(app, __dirname + '/../test_fixtures/resources')
    router.initialize(function(){
      app.listen(port, function(){
        hottap("http://localhost:" + port + "/cars").request("POST", {'Content-Type' : 'application/json'}, 
          '{"make":"Subaru", "model":"Impreza", "year":"2005"}', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(200);
          done();
        });
      });
    });
  });
});

