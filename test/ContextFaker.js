var should = require('should');
var ContextFaker = require('../index').ContextFaker;

describe("ContextFaker", function(){
  it ("fakes a 200 response", function(done){
    var resource = {
      GET : function(req, res){
        res.object({"this" : "is", "a" : "test"}).send();
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/asdf");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      JSON.parse(actual.body).should.eql(
        { "this" : "is",
          "a" : "test",
          _links : {'parent' : {'href' : 'http://localhost'}}}
      );
      done();
    });
  });
  it ("can fake a call to req.uri.parent()", function(done){
    var resource = {
      GET : function(req, res){
        res.object({"parentLink" : req.uri.parent()}).send();
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/asdf");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      JSON.parse(actual.body).should.eql(
        {"parentLink" : 'http://localhost',
          _links : {'parent' : {'href' : 'http://localhost'}}}
      );
      done();
    });
  });
  it ("fakes a 200 response with an asynch call", function(done){
    var resource = {
      GET : function(req, res){
        setTimeout(function(){
          res.object({"this" : "is", "a" : "test"}).send();
        }, 20);
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      JSON.parse(actual.body).should.eql(
        {"this" : "is", "a" : "test"}
      );
      done();
    });
  });
  it ("fakes a json POST", function(done){
    var resource = {
      GET : function(req, res){
        var body = '';
        req.on('data', function(data){
          body += data;
        });
        req.on('end', function(data){
          body += data;
          body.should.eql('{"incoming":"test"}');
          res.object({ok : true}).send();
        });
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/")
                      .body('{"incoming":"test"}');
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      JSON.parse(actual.body).should.eql(
        {ok : true}
      );
      done();
    });
  });
  it ("fakes header setting", function(done){
    var resource = {
      GET : function(req, res){
        req.headers.test.should.equal('header');
        res.object({"this" : "is", "a" : "test"}).send();
      }
    };
    var faker = new ContextFaker("GET")
                      .header("test", "header")
                      .url("/");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      JSON.parse(actual.body).should.eql(
        {"this" : "is", "a" : "test"}
      );
      done();
    });
  });
  it ("fakes headers setting", function(done){
    var resource = {
      GET : function(req, res){
        req.headers.test.should.equal('header');
        req.headers.test2.should.equal('header2');
        res.object({"this" : "is", "a" : "test"}).send();
      }
    };
    var faker = new ContextFaker("GET")
                      .headers({"test" : "header",
                                "test2" : "header2"})
                      .url("/");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      JSON.parse(actual.body).should.eql(
        {"this" : "is", "a" : "test"}
      );
      done();
    });
  });
  it ("fakes a 200 request to a module that implements fetch()", function(done){
    var resource = {
      fetch : function(req, res, cb){
        cb(null, {found : true});
      },
      GET : function(req, res){
        req.fetched.found.should.equal(true);
        res.end("YES");
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(200);
      actual.body.should.equal("YES");
      done();
    });
  });
  it ("fakes a 404 request to a module that implements fetch()", function(done){
    var resource = {
      fetch : function(req, res, cb){
        return cb(true);
      },
      GET : function(req, res){
        should.fail("should not get here");
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/asdf");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(404);
      JSON.parse(actual.body).should.eql(
        { error: 
         { type: 404,
           message: 'Not Found',
           detail: '/asdf' } }
      );
      done();
    });
  });
  it ("fakes a 500 request to a module that implements fetch()", function(done){
    var resource = {
      fetch : function(req, res, cb){
        cb("something weird happened");
      },
      GET : function(req, res){
        should.fail("should not get here");
      }
    };
    var faker = new ContextFaker("GET")
                      .url("/");
    faker.route( resource, function(actual){
      actual.statusCode.should.equal(500);
      JSON.parse(actual.body).should.eql(
        { error: 
         { type: 500,
           message: 'Internal Server Error',
           detail: 'something weird happened' } }
      );
      done();
    });
  });
  /*
  it ("fakes onJson", function(){
  });*/
  /*
  it ("fakes onBody", function(){
  });*/


});
