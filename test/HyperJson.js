var should = require('should');
var HyperJson = require('../index').HyperJson;

describe("HyperJson", function(){
  describe("#toString", function(){
    it ("should return a json string", function(){
      new HyperJson({thisis : "a test"})
          .toString().should.eql('{"thisis":"a test"}');
    });
  });
  describe("#toObject", function(){
    it ("should return a json object when given one", function(){
      new HyperJson({thisis : "a test"})
          .toObject().should.eql({thisis:"a test"});
    });
  });
  describe("#property", function(){
    it ("should add a property to a json object that doesn't have it", function(){
      new HyperJson({thisis : "a test"})
          .property("prop1", {random : "value"})
          .toObject().should.eql({ thisis : "a test", 
                                   prop1 : {
                                     random : "value"}
                                   });
    });

  });
  describe("#link", function(){
    it ("should add a link to a json object that has no links", function(){
      new HyperJson({thisis : "a test"})
          .link("self", "http://percolatorjs.com")
          .toObject().should.eql({ thisis : "a test", 
                                   _links : {
                                     self : {href : 
                                             "http://percolatorjs.com"}
                                   }});

    });
    it ("should add a link to a json object that has a link", function(){
      new HyperJson({
                      thisis : "a test",
                      _links : {  self : { href : "http://blah.com" }}
                    })
          .link("self", "http://percolatorjs.com")
          .toObject().should.eql({ thisis : "a test", 
                                   _links : {
                                     self : [
                                       {href : 
                                             "http://blah.com"},
                                       {href : 
                                             "http://percolatorjs.com"}
                                            ]
                                   }});

    });
    it ("should error if its options array has anything other than method, schema, type", function(){
      try {
        new HyperJson({thisis : "a test"})
            .link("self", "http://percolatorjs.com", {blah : 'test'});
        should.fail("expected exception was not raised");
      } catch(ex){
        ex.should.equal("unknown option: blah");
      }
    });
    it ("should add a link with type, method and schema options", function(){
      new HyperJson({thisis : "a test"})
          .link("self", "http://percolatorjs.com", {type : 'application/json', schema : {}, method : 'POST'})
          .toObject().should.eql({ thisis : "a test", 
                                   _links : {
                                     self : {href : "http://percolatorjs.com",
                                             type : 'application/json',
                                             schema : {},
                                             method : 'POST'}
                                   }});

    });
  });
});
