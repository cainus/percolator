var should = require('should');
var bch = require('../index').BodyContextHelper;


describe("BodyContextHelper", function(){
  it ("sets onBody on the object", function(done){
    var $ = { req : {}};
    var handler = {};
    bch($, handler, function(){
      (typeof $.req.onBody).should.equal('function');
      done();
    });
  });
  it ("sets the error param when there's an error", function(done){
    var fakeReq = {
      on : function(type, cb){
        switch(type){
          case 'error' : return cb('some error');
          case 'data' : return cb("a bunch of fake data");
        }
      }
    };
    var handler = {};
    var $ = { req : fakeReq };
    bch($, handler, function(){
      $.req.onBody(function(err, body){
        err.should.equal('some error');
        done();
      });
    });
  });
  it ("sets a body param when successful", function(done){
    var resumeWasCalled = false;
    var fakeReq = {
      on : function(type, cb){
        switch(type){
          case 'data' : return cb("a bunch of fake data");
          case 'end' : return cb();
        }
      }
    };
    var handler = {};
    var $ = { req : fakeReq };
    bch($, handler, function(){
      $.req.onBody(function(err, body){
        body.should.equal("a bunch of fake data");
        done();
      });
    });
  });
});
