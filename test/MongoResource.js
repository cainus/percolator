const MongoResource = require('../lib/resourceTypes/MongoResource');
const express = require('express');
const should = require('should');
const Router = require('../lib/Router').Router;
const hottap = require('hottap').hottap;
const mongoose = require('mongoose');
const _ = require('underscore');

var clearDB = function(name){
  // remove stuff
  var schemaClass = mongoose.model(name, new mongoose.Schema());
  schemaClass.collection.drop();
}

// Mongo needs to be running for these tests to pass.
var mongo_url = 'mongodb://127.0.0.1:27017/percolator_test';

describe('MongoResource', function(){ 

   beforeEach(function(done){
     clearDB('artist');
     this.app = express.createServer();
     this.db = mongoose.connect(mongo_url)
     done();
  });
   afterEach(function(done){
     try {
       this.app.close()
     } catch(ex){
        // do nothing... already closed
     }
     this.db = mongoose.connect(mongo_url)
     done();
  });


  it ("should return a proper collection for GET representing an empty mongo collection", function(done){
      this.timeout(10000);
      var app = this.app;
      var port = 1337; 
      app.settings.base_path = 'http://localhost:' + port;
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist").json("GET", function(err, result){
            app.close();
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.body.items.length.should.equal(0);
            result.body.links.self.href.should.equal("http://localhost:" + port + "/artist")
            done();
          });
        });
      });
  });


  it ("#collectionPOST returns a 400 when it can't parse the JSON", function(done){
      this.timeout(10000);
      var app = this.app;
      var port = 1337; 
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist").request("POST", {'Content-Type' : 'application/json'}, 'asdf', function(err, result){
            app.close();
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(400);
            done();
          });
        });
      });
  });

  it ("#collectionPOST returns a 415 when it's not JSON", function(done){
      this.timeout(10000);
      var app = this.app;
      var port = 1337; 
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist").request("POST", {}, 'asdf', function(err, result){
            app.close();
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(415);
            done();
          });
        });
      });
  });

  it ("#collectionPOST returns a 422 when the input doesn't fulfill the schema requirements", function(done){
      var app = this.app;
      var port = 1337;
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist")
            .request("POST", {'Content-Type':'application/json'}, '{}', function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(422);
            JSON.parse(result.body).name.should.equal("ValidationError");
            app.close();
            done();
          });
        });
     });
  });


  it ("#collectionPOST returns a 201 with a Location header", function(done){
      var app = this.app;
      var port = 1337;
      var router = new Router(app, __dirname + '/../test_fixtures/resources')
      router.initialize(function(){
        app.listen(port, function(){
          var artist = '{"name" : "artist"}';
          hottap("http://localhost:1337/artist").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
            app.close();
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(201);
            result.headers.location.should.match(/artist\/[a-z0-9]/)
            done();
          });
        });
      });
  });
  
});

