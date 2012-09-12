var should = require('should');
var bch = require('../ContextHelpers/Body');


describe("BodyContextHelper", function(){
  it ("sets onBody on the object", function(done){
    var $ = { };
    var handler = {};
    bch($, handler, function(){
      (typeof $.onBody).should.equal('function');
      done();
    });
  });
  it ("sets a body param when successful", function(done){
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
      $.onBody(function(err, body){
        body.should.equal("a bunch of fake data");
        done();
      });
    });
  });
});
