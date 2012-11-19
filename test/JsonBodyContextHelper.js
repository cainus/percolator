var should = require('should');
var jbch = require('../index').JsonBodyContextHelper;

// TODO test bad schema, successful schema, json parse error
describe("JsonBodyContextHelper", function(){
  it ("sets onJson on the object", function(done){
    var $ = { };
    var handler = {};
    jbch($, handler, function(){
      (typeof $.onJson).should.equal('function');
      done();
    });
  });
  it ("sets the error param when there's an error", function(done){
    var fakeReq = {
      on : function(type, cb){
        switch(type){
          case 'error' : return cb('some error');
          case 'data' : return cb('{"asdf":"asdf"}');
        }
      }
    };
    var handler = {};
    var $ = { req : fakeReq };
    jbch($, handler, function(){
      $.onJson(function(err, obj){
        err.should.equal('some error');
        done();
      });
    });
  });
  it ("sets an obj param when successful", function(done){
    var fakeReq = {
      on : function(type, cb){
        switch(type){
          case 'data' : return cb('{"asdf":"asdf"}');
          case 'end' : return cb();
        }
      }
    };
    var handler = {};
    var $ = { req : fakeReq };
    jbch($, handler, function(){
      $.onJson(function(err, obj){
        obj.should.eql({asdf:"asdf"});
        done();
      });
    });
  });
});
