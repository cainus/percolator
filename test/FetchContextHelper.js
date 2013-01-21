var should = require('should');
var fch = require('../index').FetchContextHelper;

describe("FetchContextHelper", function(done){
  it ("does nothing if the context has no fetch method", function(done){
    var $ = { req : { method : "PUT" }};
    var handler = {};
    fch($, handler, function(err){
      should.not.exist(err);
      should.not.exist($.fetched);
      done();
    });
  });
  it ("runs the object's fetch method if it has one", function(done){
    var handler = { fetch : function(context, cb){ done(); }};
    var $ = { req : { method : "PUT" }};
    fch($, handler, function(err, fetch){

    });
  });
  it ("sets fetched on the object", function(done){
    var handler = {
              fetch : function(context, cb){
                        cb(null, '1234');  // we fetched 1234
                      }
            };
    var $ = { req : { method : "PUT" }};
    fch($, handler, function(err){
      should.not.exist(err);
      $.fetched.should.equal('1234');
      done();
    });
  });
  it ("does nothing if the method is PUT AND handler.fetchOnPUT is false", function(done){
    var inputUrl = '';
    var handler = {
      fetchOnPUT : false,
      fetch : function(context, cb){
        should.fail("should not actually fetch!!");
      }
    };
    var $ = { req : { method : "PUT" }};
    fch($, handler, function(err){
      should.not.exist(err);
      should.not.exist($.fetched);
      done();
    });
  });
  it ("responds with a notFound status if the err is true", function(done){
    var inputUrl = '';
    var handler = {
              fetch : function(context, cb){
                        cb(true);  // true is a notFound error
                      }
    };
    var $ = {
              status : {
                notFound : function(url){ 
                  should.not.exist($.fetched);
                  url.should.equal('5678');
                  done();
                }
              },
              req : {
                url : '5678',
                method : 'GET'
              }
            };
    fch($, handler, function(){
      should.fail("this should never get called");
    });
  });
  it ("responds with an internalServerError if the err is non-true/non-falsey", function(done){
    var inputUrl = '';
    var handler = {
              fetch : function(context, cb){
                        cb({some : 'error'});  // not falsey, not strict true
                      }
    };
    var $ = {
              req : {
                method : "PUT" 
              },
              status : {
                internalServerError : function(detail){ 
                  should.not.exist($.fetched);
                  detail.should.eql({some : 'error'});
                  done();
                }
              }
            };
    fch($, handler, function(){
      should.fail("this should never get called");
    });
  });

});
