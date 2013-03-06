var should = require('should');
var HyperJsonCollection = require('../index').HyperJsonCollection;

describe("HyperJsonCollection", function(){
  describe("#toObject", function(){
    it ("should return a json object when given one", function(){
      new HyperJsonCollection({thisis : "a test"})
          .toObject().should.eql({_items:{thisis:"a test"}});
    });
    it ("should return a json collection when given an array", function(){
      new HyperJsonCollection([{thisis : "a test"}, {thisis : "too"}])
          .toObject().should.eql({ _items : {0 : {thisis:"a test"}, 1 : {thisis : "too"}}});
    });
    it ("should return a json collection indexed by a particular property when given an array and property name", function(){
      new HyperJsonCollection([{thisis : "a test"}, {thisis : "too"}], 'thisis')
          .toObject().should.eql({ _items : {"a test" : {thisis:"a test"}, "too" : {thisis : "too"}}});
    });
  });
  describe("#linkEach", function(){
    it ("should allow a cb to be specified for an array collection", function(){
      var out = new HyperJsonCollection({thisis : {value : "atest"}, 
                                        thisisalso : {value : "too"}})
          .linkEach('somerel', function(item, key){
            return '/asdf/' + key;
          })
          .toObject();
       out._items.thisis._links.should.eql({ somerel : { 
                                                    href : '/asdf/thisis'
                                                  }
                                       });
       out._items.thisisalso._links.should.eql({ somerel : { 
                                                    href : '/asdf/thisisalso'
                                                  }
                                       });
    });
    it ("should allow a cb to be specified for an array collection", function(){
      var out = new HyperJsonCollection([{thisis : "atest"}, {thisis : "too"}])
          .linkEach('somerel', function(item, key){
            return '/asdf/' + item.thisis;
          })
          .toObject();
       out._items[0]._links.should.eql({ somerel : { 
                                                    href : '/asdf/atest'
                                                  }
                                       });
       out._items[1]._links.should.eql({ somerel : { 
                                                    href : '/asdf/too'
                                                  }
                                       });
    });
  });
  describe("#each", function(){
    it ("should do nothing if there are no _items", function(){
      new HyperJsonCollection({thisis : "a test"})
          .each(function(item){
            item.decorated = true;
            return item;
          })
          .toObject().should.eql({_items:{thisis : "a test"}});
    });
    it ("should decorate each item in _items if its an array", function(){
      new HyperJsonCollection([{thisis : "a test"}, {thisis : "too"}])
          .each(function(item){
            item.decorated = true;
            return item;
          })
          .toObject().should.eql({ _items : { 0 : {thisis:"a test",
                                              decorated : true},
                                             1 : {thisis : "too",
                                             decorated : true}}});
    });
    it ("should decorate each item in _items if its an object", function(){
      new HyperJsonCollection({thisis : {value : "a test"}, andsois : {value : "this"}})
          .each(function(item, name){
            item.decorated = name;
            return item;
          })
          .toObject().should.eql({ _items : {thisis: {value : "a test", decorated : "thisis"},
                                             andsois : {value : "this", decorated : "andsois"}}});
    });
  });
});
