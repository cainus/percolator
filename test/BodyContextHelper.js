var should = require('should');
var bch = require('../index').BodyContextHelper;


describe("BodyContextHelper", function(){
  it ("sets onBody on the object", function(done){
    var $ = { };
    var handler = {};
    bch($, handler, function(){
      (typeof $.onBody).should.equal('function');
      done();
    });
  });
  it ("sets the error param when there's an error", function(done){
    var resumeWasCalled = false;
    var fakeReq = {
      on : function(type, cb){
        switch(type){
          case 'error' : return cb('some error');
          case 'data' : return cb("a bunch of fake data");
        }
      },
      resume : function(){
        resumeWasCalled = true;
      }
    };
    var handler = {};
    var $ = { req : fakeReq };
    bch($, handler, function(){
      $.onBody(function(err, body){
        err.should.equal('some error');
        resumeWasCalled.should.equal(true);
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
      },
      resume : function(){
        resumeWasCalled = true;
      }

    };
    var handler = {};
    var $ = { req : fakeReq };
    bch($, handler, function(){
      $.onBody(function(err, body){
        body.should.equal("a bunch of fake data");
        resumeWasCalled.should.equal(true);
        done();
      });
    });
  });
});
