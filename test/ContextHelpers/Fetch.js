var should = require('should');
var fch = require('../../index').FetchHelper;

describe("FetchHelper", function(done){
  it ("does nothing if the handler has no fetch method", function(done){
    var req = { method : "PUT" };
    var res = {};
    var handler = {};
    fch(req, res, handler, function(err){
      should.not.exist(err);
      should.not.exist(req.fetched);
      done();
    });
  });
  it ("runs the object's fetch method if it has one", function(done){
    var handler = { fetch : function(req, res, cb){ done(); }};
    var req = { method : "PUT" };
    var res = {};
    fch(req, res, handler, function(err, fetch){

    });
  });
  it ("sets fetched on the object", function(done){
    var handler = {
              fetch : function(req, res, cb){
                        cb(null, '1234');  // we fetched 1234
                      }
            };
    var req = { method : "PUT" };
    var res = {};
    fch(req, res, handler, function(err){
      should.not.exist(err);
      req.fetched.should.equal('1234');
      done();
    });
  });
  it ("does nothing if the method is PUT AND handler.fetchOnPUT is false", function(done){
    var inputUrl = '';
    var handler = {
      fetchOnPUT : false,
      fetch : function(req, res, cb){
        should.fail("should not actually fetch!!");
      }
    };
    var req = { method : "PUT" };
    var res = {};
    fch(req, res, handler, function(err){
      should.not.exist(err);
      should.not.exist(req.fetched);
      done();
    });
  });
  it ("responds with a notFound status if the err is true", function(done){
    var inputUrl = '';
    var handler = {
              fetch : function(req, res, cb){
                        cb(true);  // true is a notFound error
                      }
    };
    var res = {
                status : {
                  notFound : function(url){ 
                    should.not.exist(req.fetched);
                    url.should.equal('5678');
                    done();
                  }
                }
              };
    var req = {
                url : '5678',
                method : 'GET'
            };
    fch(req, res, handler, function(){
      should.fail("this should never get called");
    });
  });
  it ("responds with an internalServerError if the err is non-true/non-falsey", function(done){
    var inputUrl = '';
    var handler = {
              fetch : function(req, res, cb){
                        cb({some : 'error'});  // not falsey, not strict true
                      }
    };
    var req = {
                method : "PUT" 
              };
    var res = {
                status : {
                  internalServerError : function(detail){ 
                    should.not.exist(req.fetched);
                    detail.should.eql({some : 'error'});
                    done();
                  }
                }
            };
    fch(req, res, handler, function(){
      should.fail("this should never get called");
    });
  });

});
