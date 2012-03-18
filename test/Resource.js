const express = require('express');
const should = require('should');
const hottap = require('hottap').hottap;
const _ = require('underscore');
var percolator = require('../');
var Router = percolator.Router;

function setUp(){
}

describe('Resource', function(){ 

  beforeEach(function(done){
    var resourceDir = __dirname + '/test_fixtures/resources';
    this.app = express.createServer()
    this.router = new Router(this.app, resourceDir)
    done();
  });
  afterEach(function(done){
    try {this.app.close();} catch(ex){ /* do nothing. already closed */ }
    done();
  });


  it ("should return 422 when parameters are missing", function(done){
    var app = this.app;
    var router = this.router;
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
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

  it ("should return 422 when the year is less than 1930", function(done){
    var app = this.app;
    var router = this.router;
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
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

  it ("should return 422 when an disallowed extra attribute is passed in", function(done){
    var app = this.app;
    var router = this.router;
    var port = 1337; 
    app.settings.base_path = 'http://localhost:' + port;
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

  it ("should return 200 when an allowed extra attribute is passed in", function(done){
    var app = this.app;
    var router = this.router;
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
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

  it ("should return 200 when all the required attributes are passed in", function(done){
    var app = this.app;
    var router = this.router;
    var port = 1337;
    app.settings.base_path = 'http://localhost:' + port;
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

