const InMemoryCollection = require('../lib/resourceTypes/InMemoryCollection');
const express = require('express');
const should = require('should');
const Router = require('../lib/Router').Router;
const hottap = require('hottap').hottap;
const _ = require('underscore');
const resourceful = require('resourceful');
var City;

function parentDir(path){
  if (path[path.length - 1] == '/'){
    path = path.substring(0, path.length -1);
  }
  return _.initial(path.split("/")).join("/")
}



// Mongo needs to be running for these tests to pass.
var mongo_url = 'mongodb://127.0.0.1:27017/percolator_test';

describe('InMemoryCollection', function(){

  beforeEach(function(done){
    this.resourceDir = __dirname + '/test_fixtures/resources';
    this.app = express.createServer();
    this.port = 9999; 
    this.base_path = 'http://localhost:' + this.port;
    this.collectionUrl = this.base_path + "/city"
    this.app.settings.base_path = this.base_path
    this.router = new Router(this.app, this.resourceDir)
    var cityModule;
    _.each(this.router.resourceTree.children, function(kid){
      if (kid.path == 'city'){
        cityModule = kid.module;
      }
    });
    cityModule.clear(done);
  });

  afterEach(function(done){
    try {
      this.app.close()
    } catch(ex){
       // do nothing... already closed
    }
    done();
  });


  describe("#GET", function(){
    it ("returns a 404 if no resource exists with a corresponding id", function(done){
        var env = this;
        this.app.listen(this.port, function(){
          hottap(env.collectionUrl + "/000").request("GET", {'Content-Type' : 'application/json'}, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(404);
            done();
          });
        });
    });

    it ("returns a single resource if one exists", function(done){
        var env = this;
        this.app.listen(this.port, function(){
          var city = '{"name" : "Toronto", "country" : "Canada"}';
          hottap(env.collectionUrl).request("POST", {'Content-Type' : 'application/json'}, city, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            result.status.should.equal(201);
            result.headers.location.should.match(/city\/[a-z0-9]/)
            var location = result.headers.location
            var url = env.base_path + location
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
      var env = this;
      var artist = '{"name" : "artist"}';
      this.app.listen(this.port, function(){
        hottap(env.collectionUrl + "/000").request("PUT", {'Content-Type' : 'application/json'}, artist, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(404);
          done();
        });
      });
    });

    it ("does not update a resource if update doesn't pass validations", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        var city = '{"name" : "Toronto", "country" : "Canada" }';
        hottap(env.collectionUrl).request("POST", {'Content-Type' : 'application/json'}, city, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(201);
          result.headers.location.should.match(/city\/[a-z0-9]/)
          var location = result.headers.location
          var url = env.base_path + location
          city = '{"name" : "Muddy York"}';
          hottap(url).request("PUT", {'Content-Type' : 'application/json'}, city, function(err, result){
              var body = JSON.parse(result.body);
              result.status.should.equal(422)
              body.error.type.should.equal("ValidationError")
              body.error.message.should.equal("That document was invalid due to a missing required field")
              body.error.detail[0].should.equal("country")
              done();
          });
        });
      });
    });

    it ("updates a resource if one exists", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        var city = '{"name" : "Toronto", "country" : "Canada" }';
        hottap(env.collectionUrl).request("POST", {'Content-Type' : 'application/json'}, city, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(201);
          result.headers.location.should.match(/city\/[a-z0-9]/)
          var location = result.headers.location
          var url = env.base_path + location
          city = '{"name" : "Muddy York", "country" : "Canada" }';
          hottap(url).request("PUT", {'Content-Type' : 'application/json'}, city, function(err, result){
              var body = JSON.parse(result.body);
              result.status.should.equal(200)
              body.name.should.equal("Muddy York")
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
      var env = this;
      this.app.listen(this.port, function(){
        hottap(env.collectionUrl + "/000").request("DELETE", {'Content-Type' : 'application/json'}, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(404);
          done();
        });
      });
    });

    it ("deletes a resource if one exists", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        var city = '{"name" : "Toronto", "country" : "Canada"}';
        hottap(env.collectionUrl).request("POST", {'Content-Type' : 'application/json'}, city, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(201);
          result.headers.location.should.match(/city\/[a-z0-9]/)
          var location = result.headers.location
          var url = env.base_path + location
          hottap(url).request("GET", {'Content-Type' : 'application/json'}, function(err, result){
            result.status.should.equal(200);
            hottap(url).request("DELETE", {'Content-Type' : 'application/json'}, function(err, result){
                    result.status.should.equal(204)
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
    it ("should return a proper collection for GET representing an empty collection", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        hottap(env.collectionUrl)
            .request("GET", {'content-type' : 'application/json'}, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.body = JSON.parse(result.body);
          result.body.items.length.should.equal(0);
          result.body.links.self.href.should.equal("/city")
          done();
        });
      });
    });
   
    it ("should return a proper collection for GET when resource has been added", function(done){
      var env = this
      this.app.listen(this.port, function(){
        var city = '{"name" : "Toronto", "country" : "Canada"}';
        hottap(env.collectionUrl).request("POST", {'content-type' : 'application/json'}, city, function(err, result){
          var self_location = result.headers.location;
          hottap(env.collectionUrl).request("GET", {'Content-Type' : 'application/json'}, function(err, result){
            if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
            var body = JSON.parse(result.body);
            body.items.length.should.equal(1);
            body.items[0].links.self.href.should.equal(self_location)
            body.items[0].links.parent.href.should.equal("/city")
            done();
          });
        });
      });
    });
  });

  // TODO error response is non-json, when posted content-type is non-json.
  // we should always respond w json here.
  
  // TODO 'parent' link appears to be '' when it should be '/'

  describe("#collectionPOST", function(){
    it ("returns a 400 when it can't parse the JSON", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        hottap(env.collectionUrl).request("POST", {'Content-Type' : 'application/json'}, 'asdf', function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(400);
          done();
        });
      });
    });

    it ("returns a 415 when it's not JSON", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        hottap(env.collectionUrl).request("POST", {}, 'asdf', function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(415);
          done();
        });
      });
    });

    it ("returns a 422 when the input doesn't fulfill the schema requirements", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        hottap(env.collectionUrl)
          .request("POST", {'Content-Type':'application/json'}, '{}', function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(422);
          JSON.parse(result.body).error.type.should.equal("ValidationError");
          done();
        });
      });
    });

    it ("returns a 201 with a Location header when doc is valid", function(done){
      var env = this;
      this.app.listen(this.port, function(){
        var city = '{"name" : "Toronto", "country" : "Canada"}';
        hottap(env.collectionUrl).request("POST", {'Content-Type' : 'application/json'}, city, function(err, result){
          if (!!err){ console.log(err); should.fail("error shouldn't exist. " + err);}
          result.status.should.equal(201);
          result.headers.location.should.match(/city\/[a-z0-9]/)
          done();
        });
      });
    });


  });

});
