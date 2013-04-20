var should = require('should');
var ObjectHelper = require('../../index').ObjectHelper;
var urlgrey = require('urlgrey');

describe("ObjectHelper", function(){
  it ("should decorate the res object with object and collection methods", function(done){
    var req = {};
    var res = {};
    var handler = {};
    ObjectHelper(req, res, handler, function(){
      should.exist(res.collection);
      should.exist(res.object);
      done();
    });
  });
  describe("#collection", function(){
    it ("should allow collection methods", function(done){
      var req = {};
      var res = {};
      var handler = {};
      ObjectHelper(req, res, handler, function(){
        var collection = res.collection([{"A" : "A"}, {"B" : "B"}, {"C" : "C"}]);
        var obj = collection.toObject();
        obj.should.eql({ _items: [ { A: 'A' }, { B: 'B' }, { C: 'C' } ] });
        should.exist(collection.send);
        done();
      });
    });
    describe("#send", function(){
      it ("should add default links and try to send as json", function(done){
        var sent = false;
        var headerSet = false;
        var req = { 
                    uri : urlgrey('http://localhost:8080/asdf'),
                    app : { autoLink : true }
                  };
        var res = { 
          setHeader : function(name, value){
            name.toLowerCase().should.equal('content-type');
            value.should.equal('application/json');
            headerSet = true;
          },
          end : function(data){
            sent = true;
            JSON.parse(data).should.eql({
              _items: [ { A: 'A' }, { B: 'B' }, { C: 'C' } ],
              _links: { 
                parent: { href: 'http://localhost:8080' } 
              }
            });
          } 
        };
        var handler = {};
        ObjectHelper(req, res, handler, function(){
          res.collection([{"A" : "A"}, {"B" : "B"}, {"C" : "C"}])
            .send();
          sent.should.equal(true);
          headerSet.should.equal(true);
          done();
        });
      });
      it ("should not add a parent link if the root has no parent", function(done){
        var sent = false;
        var headerSet = false;
        var req = { 
                    uri : urlgrey('http://localhost:8080/'),
                    app : { autoLink : true }
                  };
        var res = { 
          setHeader : function(name, value){
            name.toLowerCase().should.equal('content-type');
            value.should.equal('application/json');
            headerSet = true;
          },
          end : function(data){
            sent = true;
            JSON.parse(data).should.eql({
              _items: [ { A: 'A' }, { B: 'B' }, { C: 'C' } ]
            });
          } 
        };
        var handler = {};
        ObjectHelper(req, res, handler, function(){
          res.collection([{"A" : "A"}, {"B" : "B"}, {"C" : "C"}])
            .send();
          headerSet.should.equal(true);
          sent.should.equal(true);
          done();
        });
      });
    });
  });


});
