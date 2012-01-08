const should = require('should');
const percolator = require('../percolator');

describe('percolator_module', function(){
  var req = {}
  var res = {}
  var next = function(){ should.ok(false); }
  var subject = percolator({available : true})

  beforeEach(function(done){
    req = {}
    res = {}
    next = function(){ should.ok(false, 'should not continue') }
    done();
  });

  describe('#percolator()', function(){
    it('should not allow requests when the service is unavailable', function(done){
      res.send = function(msg, status){
        status.should.equal(503);
        msg.should.equal('Service Unavailable.  This service is in "unavailable" mode.');
        done();
      }
      percolator({available : false})(req, res, next);
    })

    it('should not allow non-standard methods', function(done){
        req.method = 'wtf';
        res.send = function(msg, status){
          status.should.equal(501);
          msg.should.equal('Not Implemented.  That is not a known method.');
          done();
        }
        subject(req, res, next);
    })

    it('should not allow uris that are too long', function(done){
        req.method = 'GET';
        req.url = '';
        for(var i = 0; i < 500; i++){
            req.url += '1234567890';
        }
        res.send = function(msg, status){
          status.should.equal(414);
          msg.should.equal('Request URI Too Long.');
          done();
        }
        subject(req, res, next);
    });

  })
})


