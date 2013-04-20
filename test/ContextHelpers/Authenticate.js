var should = require('should');
var fch = require('../../index').AuthenticateHelper;

describe("AuthenticateHelper", function(done){
  it ("does nothing if the handler has no authenticate method", function(done){
    var req = {};
    var res = {};
    var handler = {};
    fch(req, res, handler, function(err){
      should.not.exist(err);
      should.not.exist(req.authenticated);
      done();
    });
  });
  it ("runs the object's authenticate method if it has one", function(done){
    var handler = { authenticate : function(req, res, cb){ done(); }};
    var req = {};
    var res = {};
    fch(req, res, handler, function(err, fetch){

    });
  });
  it ("sets authenticated on the object", function(done){
    var req = {};
    var res = {};
    var handler  = {
              authenticate : function(req, res, cb){
                        cb(null, '1234');  // we got 1234
                      }
            };
    fch(req, res, handler, function(err){
      should.not.exist(err);
      req.authenticated.should.equal('1234');
      done();
    });
  });
  it ("responds with an unauthenticated status if the err is true", function(done){
    var inputUrl = '';
    var handler = {
              authenticate : function(req, res, cb){
                        cb(true);  // true is a notFound error
                      }
    };
    var req = {};
    var res = {
                status : {
                  unauthenticated : function(){ 
                    should.not.exist(req.authenticated);
                    done();
                  }
                }
            };
    fch(req, res, handler, function(){
      should.fail("this should never get called");
    });
  });
  it ("responds with an internalServerError if the err is non-true/non-falsey", function(done){
    var inputUrl = '';
    var handler = {
              authenticate : function(req, res, cb){
                        cb({some : 'error'});  // not falsey, not strict true
                      }
    };
    var req = {};
    var res = {
                status : {
                  internalServerError : function(detail){ 
                    should.not.exist(req.authenticated);
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
