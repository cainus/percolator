const MongoResource = require('../lib/resourceTypes/MongoResource');
const express = require('express');
const should = require('should');
const Router = require('../lib/Router').Router;
const hottap = require('hottap').hottap;
const mongoose = require('mongoose');
const _ = require('underscore');

function setUp(){
    var resourceDir = __dirname + '/test_fixtures/resources';
    var app = express.createServer()
    return { app : app,
             router : new Router(app, resourceDir) }
}

function parentDir(path){
  if (path[path.length - 1] == '/'){
    path = path.substring(0, path.length -1);
  }
  return _.initial(path.split("/")).join("/")
}

var clearDB = function(name){
  // remove stuff
  var schemaClass = mongoose.model(name, new mongoose.Schema({
        'name' : { type: String, match: /[a-zA-z0-9\.]/, required : true },
        'created' :  { type: Date, default: Date.now, required : true }
}));
  schemaClass.collection.drop();
}

// Mongo needs to be running for these tests to pass.
var mongo_url = 'mongodb://127.0.0.1:27017/percolator_test';

describe('MongoResource', function(){

   beforeEach(function(done){
     this.resourceDir = __dirname + '/test_fixtures/resources';
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


  describe("#GET", function(){
    it ("returns a 404 if not resource exists with a corresponding id", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          hottap("http://localhost:9999/artist/000").request("GET", {'Content-Type' : 'application/json'}, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(404);
            done();
          });
        });
    });

    it ("returns a single resource if one exists", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          var artist = '{"name" : "artist"}';
          hottap("http://localhost:9999/artist").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(201);
            result.headers.location.should.match(/artist\/[a-z0-9]/)
            var location = result.headers.location
            var url = 'http://localhost:9999' + location
            hottap(url).request("GET", {'Content-Type' : 'application/json'}, function(err, result){
                    var body = JSON.parse(result.body);
                    result.status.should.equal(200)
                    body.links.self.href.should.equal(location)
                    body.links.parent.href.should.equal(parentDir(location))
                    done();
            });
          });
        });
    });
  });



  describe("#PUT", function(){

    it ("returns a 404 if resource doesn't exist", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        var artist = '{"name" : "artist"}';
        this.app.listen(port, function(){
          hottap("http://localhost:9999/artist/000").request("PUT", {'Content-Type' : 'application/json'}, artist, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(404);
            done();
          });
        });
    });

    // TODO what if the update doesn't pass validations?!?

    it ("updates a resource if one exists", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          var artist = '{"name" : "artist"}';
          hottap("http://localhost:9999/artist").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(201);
            result.headers.location.should.match(/artist\/[a-z0-9]/)
            var location = result.headers.location
            var url = 'http://localhost:9999' + location
            artist = '{"name" : "otherartist"}';
            hottap(url).request("PUT", {'Content-Type' : 'application/json'}, artist, function(err, result){
                    var body = JSON.parse(result.body);
                    result.status.should.equal(200)
                    body.name.should.equal("otherartist")
                    body.links.self.href.should.equal(location)
                    body.links.parent.href.should.equal(parentDir(location))
                    done();
            });
          });
        });
    });
  
  
  });


  describe("#DELETE", function(){
    it ("returns a 404 if resource doesn't exist", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          hottap("http://localhost:9999/artist/000").request("DELETE", {'Content-Type' : 'application/json'}, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(404);
            done();
          });
        });
    });
 
    it ("deletes a resource if one exists", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          var artist = '{"name" : "artist"}';
          hottap("http://localhost:9999/artist").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(201);
            result.headers.location.should.match(/artist\/[a-z0-9]/)
            var location = result.headers.location
            var url = 'http://localhost:9999' + location
            hottap(url).request("GET", {'Content-Type' : 'application/json'}, function(err, result){
              result.status.should.equal(200);
              hottap(url).request("DELETE", {'Content-Type' : 'application/json'}, function(err, result){
                      result.status.should.equal(200)
                      hottap(url).request("GET", {'Content-Type' : 'application/json'}, function(err, result){
                        result.status.should.equal(404);
                        done();
                      });
              });
            });
          });
        });
    });
  
  });


  describe("#collectionGET", function(){
    it ("should return a proper collection for GET representing an empty mongo collection", function(done){
        var port = 9999; 
        this.app.settings.base_path = 'http://localhost:' + port;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist").json("GET", function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.body.items.length.should.equal(0);
            result.body.links.self.href.should.equal("/artist")
            done();
          });
        });
    });
    it ("should return a proper collection for GET when resource has been added", function(done){
        var port = 9999; 
        this.app.settings.base_path = 'http://localhost:' + port;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          var artist = '{"name" : "artist"}';
          hottap("http://localhost:9999/artist").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
            var self_location = result.headers.location;
            hottap("http://localhost:" + port + "/artist").request("GET", {'Content-Type' : 'application/json'}, function(err, result){
              if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
              var body = JSON.parse(result.body);
              body.items.length.should.equal(1);
              body.items[0].links.self.href.should.equal(self_location)
              body.items[0].links.parent.href.should.equal("/artist")
              done();
            });
          });
        });
    });
  });

  describe("#collectionPOST", function(){
    it ("returns a 400 when it can't parse the JSON", function(done){
        var port = 9999; 
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist").request("POST", {'Content-Type' : 'application/json'}, 'asdf', function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(400);
            done();
          });
        });
    });

    it ("returns a 415 when it's not JSON", function(done){
        this.timeout(10000);
        var port = 9999; 
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist").request("POST", {}, 'asdf', function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(415);
            done();
          });
        });
    });

    it ("returns a 422 when the input doesn't fulfill the schema requirements", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          hottap("http://localhost:" + port + "/artist")
            .request("POST", {'Content-Type':'application/json'}, '{}', function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(422);
            JSON.parse(result.body).error.type.should.equal("ValidationError");
            done();
          });
        });
    });


    it ("returns a 201 with a Location header when doc is valid", function(done){
        var port = 9999;
        var router = new Router(this.app, this.resourceDir)
        this.app.listen(port, function(){
          var artist = '{"name" : "artist"}';
          hottap("http://localhost:9999/artist").request("POST", {'Content-Type' : 'application/json'}, artist, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(201);
            result.headers.location.should.match(/artist\/[a-z0-9]/)
            done();
          });
        });
    });

  });

});
