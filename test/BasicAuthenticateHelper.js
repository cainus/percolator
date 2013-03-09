var should = require('should');
var bach = require('../index').BasicAuthenticateHelper;

describe("BasicAuthenticateHelper", function(done){
  it ("does nothing if the handler has no basicAuthenticate method", function(done){
    var req = {};
    var res = {};
    var handler = {};
    bach(req, res, handler, function(err){
      should.not.exist(err);
      should.not.exist(req.authenticated);
      done();
    });
  });
  it ("runs the object's basicAuthenticate method if it has one", function(done){
    var calledBasicAuthenticate = false;
    var schemeHeaderSet = false;
    var handler = {
                    basicAuthenticate : function(login, password, req, res, cb){
                                          done();
                                        }
                  };
    var req = {
                headers : { authorization  : 'Basic bG9naW46cGFzc3dvcmQ=' }
    };
    var res = {};
    bach(req, res, handler, function(err, fetch){
      should.fail("this should never get called");
    });
  });
  it ("sets authenticated on the object", function(done){
    // login:password  -> bG9naW46cGFzc3dvcmQ=
    var res = {
                setHeader : function(name, value){
                  //schemeHeaderSet = true;
                }
              };
    var req = {
                headers : { authorization : 'Basic bG9naW46cGFzc3dvcmQ=' }
    };
    var handler  = {
              basicAuthenticate : function(login, password, req, res, cb){
                        cb(null, '1234');  // we got 1234
                      }
            };
    bach(req, res, handler, function(err){
      should.not.exist(err);
      req.authenticated.should.equal('1234');
      done();
    });
  });
  it ("sets returns 401 when the scheme is not basic", function(done){
    // login:password  -> bG9naW46cGFzc3dvcmQ=
    var schemeHeaderSet = false;
    var unauthenticatedCalled = false;
    var res = {
                setHeader : function(name, value){
                  name.should.equal('WWW-Authenticate');
                  value.should.equal('Basic');
                  schemeHeaderSet = true;
                },
                status : {
                  unauthenticated : function(){ 
                    should.not.exist(req.authenticated);
                    schemeHeaderSet.should.equal(true);
                    done();
                  }
                }
              };
    var req = {
      headers : { authorization : 'Digest bG9naW46cGFzc3dvcmQ=' }
    };
    var handler  = {
              basicAuthenticate : function(login, password, req, res, cb){
                        cb(null, '1234');  // we got 1234
                      }
            };
    bach(req, res, handler, function(err){
      should.fail("this should never get called");
    });
  });
  it ("responds with an unauthenticated status if Authorization header isn't there", function(done){
    var inputUrl = '';
    var schemeHeaderSet = false;
    var handler = {
              basicAuthenticate : function(login, password, req, res, cb){
                should.fail("this should never get called");
              }
    };
    var req = {
                headers : { }
              };
    var res = {
                setHeader : function(name, value){
                  schemeHeaderSet = true;
                },
                status : {
                  unauthenticated : function(){ 
                    should.not.exist(req.authenticated);
                    schemeHeaderSet.should.equal(true);
                    done();
                  }
                }
            };
    bach(req, res, handler, function(){
      should.fail("this should never get called");
    });
  });
  it ("responds with an unauthenticated status if the err is true", function(done){
    var inputUrl = '';
    var schemeHeaderSet = false;
    var handler = {
              basicAuthenticate : function(login, password, req, res, cb){
                        cb(true);  // true is an error
              }
    };
    var req = {
                headers : { authorization  : 'Basic bG9naW46cGFzc3dvcmQ=' }
              };

    var res = {
                setHeader : function(name, value){
                  schemeHeaderSet = true;
                },
                status : {
                  unauthenticated : function(){ 
                    should.not.exist(req.authenticated);
                    schemeHeaderSet.should.equal(true);
                    done();
                  }
                }
            };
    bach(req, res, handler, function(){
      should.fail("this should never get called");
    });
  });
  it ("responds with an internalServerError if the err is non-true/non-falsey", function(done){
    var inputUrl = '';
    var handler = {
                      basicAuthenticate : function(login, password, req, res, cb){
                        cb({some : 'error'});  // not falsey, not strict true
                      }
    };
    var schemeHeaderSet = false;
    var req = {
                headers : { authorization : 'Basic bG9naW46cGFzc3dvcmQ=' }
              };
    var res = {
                setHeader : function(name, value){
                  schemeHeaderSet = true;
                },
                status : {
                  internalServerError : function(detail){ 
                    should.not.exist(req.authenticated);
                    detail.should.eql({some : 'error'});
                    done();
                  }
                }
            };
    bach(req, res, handler, function(){
      should.fail("this should never get called");
    });
  });

});
