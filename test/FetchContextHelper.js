var should = require('should');
var fch = require('../ContextHelpers/Fetch');

describe("FetchContextHelper", function(done){
  it ("does nothing if the context has no fetch method", function(done){
    var $ = {};
    fch($, function(err){
      should.not.exist(err);
      should.not.exist($.fetched);
      done();
    });
  });
  it ("runs the object's fetch method if it has one", function(done){
    var $ = { fetch : function(context, cb){ done(); }};
    fch($, function(err, fetch){

    });
  });
  it ("sets fetched on the object", function(done){
    var $ = {
              fetch : function(context, cb){
                        cb(null, '1234');  // we fetched 1234
                      }
            };
    fch($, function(err){
      should.not.exist(err);
      $.fetched.should.equal('1234');
      done();
    });
  });
  it ("responds with a notFound status if the err is true", function(done){
    var inputUrl = '';
    var $ = {
              fetch : function(context, cb){
                        cb(true);  // true is a notFound error
                      },
              status : {
                notFound : function(url){ 
                  should.not.exist($.fetched);
                  url.should.equal('5678');
                  done();
                }
              },
              req : {
                url : '5678'
              }
            };
    fch($, function(){
      should.fail("this should never get called");
    });
  });
  it ("responds with an internalServerError if the err is non-true/non-falsey", function(done){
    var inputUrl = '';
    var $ = {
              fetch : function(context, cb){
                        cb({some : 'error'});  // not falsey, not strict true
                      },
              status : {
                internalServerError : function(detail){ 
                  should.not.exist($.fetched);
                  detail.should.eql({some : 'error'});
                  done();
                }
              }
            };
    fch($, function(){
      should.fail("this should never get called");
    });
  });

});
