const MongoResource = require('../resourceTypes/MongoResource');
const express = require('express');
const should = require('should');
const Router = require('../Router').Router;
const hottap = require('hottap').hottap;
const mongoose = require('mongoose');
const _ = require('underscore');
const fullBodyParser = require('../fullBodyParser');
const jsonBodyParser = require('../jsonBodyParser');

var lastPort = 1300;
function getPort(){
  lastPort++
  return lastPort;
}


var clearDB = function(name){
  // remove stuff
  var schemaClass = mongoose.model(name, new mongoose.Schema());
  schemaClass.collection.drop();
}

var mongo_url = 'mongodb://127.0.0.1:27017/percolator_test';

describe('MongoResource', function(){ 

   beforeEach(function(done){
     clearDB('artists');
     this.db = mongoose.connect(mongo_url)
     done();
  });


  it ("should return a proper collection for GET representing an empty mongo collection", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var port = getPort();
      app.settings.base_path = 'http://localhost:' + port;
      var router = new Router(app, 'http://localhost:' + port + '/', __dirname + '/../test_fixtures/resources', '')

      app.listen(port, function(){
        hottap("http://localhost:" + port + "/artists").json("GET", function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.body.items.length.should.equal(0);
          result.body.links.self.href.should.equal("http://localhost:" + port + "/artists")
          done();
        });
      });
  });


  it ("#collectionPOST returns a 400 when it can't parse the JSON", function(done){
      this.timeout(10000);
      var app = express.createServer();
      app.use(fullBodyParser());
      app.use(jsonBodyParser());
      var port = getPort();
      var router = new Router(app, 'http://localhost:' + port + '/', __dirname + '/../test_fixtures/resources', '')
      app.listen(port, function(){
        hottap("http://localhost:" + port + "/artists").request("POST", {'Content-Type' : 'application/json'}, 'asdf', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(400);
          done();
        });
      });
  });

  it ("#collectionPOST returns a 415 when it's not JSON", function(done){
      this.timeout(10000);
      var app = express.createServer();
      var port = getPort();
      var router = new Router(app, 'http://localhost:'+ port + '/', __dirname + '/../test_fixtures/resources', '')

      app.listen(port, function(){
        hottap("http://localhost:" + port + "/artists").request("POST", {}, 'asdf', function(err, result){
          app.close();
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(415);
          done();
        });
      });
  });

  it ("#collectionPOST returns a 422 when the input doesn't fulfill the schema requirements"); /*, function(done){
     // NO IDEA HOW TO MAKE THIS WORK!!! WTF!!!
````` this.timeout(10000);
      var app = express.createServer();
      app.configure(function(){
        app.use(fullBodyParser());
      });
      var port = getPort();
      var router = new Router(app, 'http://localhost:' + port + '/', __dirname + '/../test_fixtures/resources')

      app.listen(port, function(){
        hottap("http://localhost:" + port + "/artists").request("POST", {'Content-Type':'application/json'}, '{}', function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          console.log('rizzle', result);
          hottap(result.headers.location).request("GET", {'Content-Type':'application/json'}, function(err, response){
            console.log('err', err);
            console.log('response', response);
          });
          app.close();
          result.status.should.equal(422);
          var schemaClass = mongoose.model('artists', new mongoose.Schema());
          schemaClass.find({}).execFind(function(err, docs){
            console.log(docs);
            docs.count.should.equal(0);
            done();
          });
        });
      });
  });
*/


  it ("#collectionPOST returns a 201 with a Location header");
/*
  it ("#collectionPOST returns a 201 with a Location header", function(done){
      this.timeout(10000);
      var app = express.createServer();
      app.configure(function(){
        app.use(fullBodyParser());
      });
      var port = getPort();
      var router = new Router(app, 'http://localhost:' + port + '/', __dirname + '/../test_fixtures/resources')

      app.listen(port, function(){
        var artist = '{"name" : "artist"' + port + '}';
        hottap("http://localhost:' + port '/artists").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
          app.close();
          console.log(result);
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(201);
          result.headers['Location'].should.equal("http://localhost:3000/artists")
          done();
        });
      });
  });
  */
});

