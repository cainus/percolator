var should = require('should');
var JsonResponder = require('../index').JsonResponder;

var FakeResponse = function(){
  this.status = null;
  this.ended = false;
  this.headers = {};
  this.body = '';
  this.writeHead = function(status){
    this.status = status;
  };
  this.setHeader = function(name, value){
    this.headers[name] = value;
  };
  this.end = function(out){
    this.ended = true;
    this.body = out;
  };
};

describe("JsonResponder", function(){

  describe("#badRequest", function(){
    it ("sets the status to 400", function(done){
      var fakeRes = new FakeResponse();
      var responder = new JsonResponder({}, fakeRes);
      var expected = {type : 400,
                      message : 'Bad Request',
                      detail : 'bad request'};
      responder.on('error', function(data){
        data.type.should.equal(expected.type);
        data.message.should.equal(expected.message);
        data.detail.should.equal(expected.detail);
        done();
      });
      responder.badRequest(expected.detail);
      fakeRes.status.should.equal(expected.type);
      fakeRes.ended.should.equal(true);
      fakeRes.headers['Content-Type'].should.equal("application/json");
      var response = JSON.parse(fakeRes.body);
      response.error.should.eql(expected);
    });
  });
  describe("#accepted", function(){
    it ("sets the status to 202", function(){
      var fakeRes = new FakeResponse();
      var responder = new JsonResponder({}, fakeRes);
      responder.accepted();
      fakeRes.status.should.equal(202);
      fakeRes.ended.should.equal(true);
    });
  });
  describe("#movedPermanently", function(){
    it ("sets the Location header and sets the status to 301", function(){
      var fakeRes = new FakeResponse();
      var responder = new JsonResponder({}, fakeRes);
      responder.movedPermanently("SOMEURL");
      fakeRes.headers.Location.should.equal("SOMEURL");
      fakeRes.status.should.equal(301);
      fakeRes.ended.should.equal(true);
    });
  });
  describe("#OPTIONS", function(){
    it ("sets the Allow header and sets the status to 200", function(){
      var fakeRes = new FakeResponse();
      var responder = new JsonResponder({}, fakeRes);
      responder.OPTIONS(["GET", "POST"]);
      fakeRes.headers.Allow.should.equal("GET,POST");
      fakeRes.status.should.equal(200);
      fakeRes.ended.should.equal(true);
      JSON.parse(fakeRes.body)['allowed methods'].should.eql(["GET", "POST"]);
    });
  });
  describe("#redirect", function(){
    it ("sets the Location header and sets the status to 301", function(){
      var fakeRes = new FakeResponse();
      var responder = new JsonResponder({}, fakeRes);
      responder.movedPermanently("SOMEURL");
      fakeRes.headers.Location.should.equal("SOMEURL");
      fakeRes.status.should.equal(301);
      fakeRes.ended.should.equal(true);
    });
  });
  describe("#created", function(){
    it ("sets the Location header and sets the status to 201", function(){
      var fakeRes = new FakeResponse();
      var responder = new JsonResponder({}, fakeRes);
      responder.created("SOMEURL");
      fakeRes.headers.Location.should.equal("SOMEURL");
      fakeRes.status.should.equal(201);
      fakeRes.ended.should.equal(true);
    });
  });
});
