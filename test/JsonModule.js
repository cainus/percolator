var JsonModule = require('../index').JsonModule;
var should = require('should');

describe("JsonModule", function(){
    it ("throws an exception if there's no list() passed in the options param", function(){
      try {
        var module = new JsonModule({});
        should.fail("expected exception was not raised");
      } catch(ex){
        ex.should.equal("JsonModule needs an options array with a 'list' function.");
      }

    });
  describe("when schema is set", function(){
    it ("collection GET outputs a create link", function(done){
        var module = new JsonModule({
                                      list : function($, cb){ cb([]); },
                                      create : function($, obj){ },
                                      schema : { troof : true}
                                    });
        var $ = {
          uri : {
            self : function(){ return 'http://self'; }
          },

          jsonCollection : function(){
            return {
              linkEach : function(){
                return {
                  link : function(rel, href, opts){
                    rel.should.equal('create');
                    href.should.equal('http://self');
                    opts.should.eql({method : 'POST',
                                     schema : { troof : true}});
                    return {
                      send : function(){
                        done();
                      }
                    };
                  }
                };
              }
            };
          }
        };
        module.handler.GET($);
    });
  });
  it ("collection POST throws errors when input doesn't match schema", function(done){
        var module = new JsonModule({
                                      list : function($, cb){ cb([]); },
                                      create : function($, obj){ },
                                      schema : {
                                                 "properties": {
                                                    "age": {
                                                      "type": "number"
                                                    },
                                                    "name": {
                                                      "type": "string"
                                                    }
                                                  }
                                                }
                                    });
        var $ = {
          status : {
            badRequest : function(message, detail){
              message.should.equal('json failed schema validation.');
              detail[0].details[0].should.equal('number');
              // detail looks like this:
              // [ { uri: 'urn:uuid:67ef53a9-1b09-48b1-b97d-fae313e4ee39#/age',
              // schemaUri: 'urn:uuid:51edca59-120a-4486-a961-0ee2aa5c276b#/properties/age',
              // attribute: 'type',
              // message: 'Instance is not a required type',
              // details: [ 'number' ] } ]
              done();
            }
          },

          onBody : function(cb){
            cb(null, '{"age":"37", "name":"GDizzle"}'); 
            // above mistakenly sends age as a string
          }

        };
        module.handler.POST($);
  });

  it ("collection POST throws errors when input doesn't match schema 2", function(done){
        var module = new JsonModule({
                                      list : function($, cb){ cb([]); },
                                      create : function($, obj){ },
                                      schema : {
                                                 "properties": {
                                                    "age": {
                                                      "type": "number"
                                                    },
                                                    "name": {
                                                      "type": "string"
                                                    }
                                                  },
                                                  "additionalProperties" : false
                                                }
                                    });
        var $ = {
          status : {
            badRequest : function(message, detail){
              message.should.equal('json failed schema validation.');
              detail[0].message.should.equal('Additional properties are not allowed');
              // detail looks like this:
              // [ { uri: 'urn:uuid:167293d9-3c95-493d-826e-1bfd4146a8b9#',
              // schemaUri: 'urn:uuid:b7e07efd-fd80-4370-8206-9162f4c39cc9#',
              // attribute: 'additionalProperties',
              // message: 'Additional properties are not allowed',
              // details: false } ]
              done();
            }
          },

          onBody : function(cb){
            cb(null, '{"age":37, "name":"GDizzle", "wrong" : "wrong"}'); 
            // above mistakenly sends an additional property when
            // additionalProperties is false
          }

        };
        module.handler.POST($);
  });

  it ("collection POST throws an error when the json is invalid", function(done){
        var module = new JsonModule({
                                      list : function($, cb){ cb([]); },
                                      create : function($, obj){ }
                                    });
        var $ = {
          status : {
            badRequest : function(message, detail){
              message.should.equal('invalid json.');
              detail.should.equal('{"age":37,}');
              done();
            }
          },

          onBody : function(cb){
            cb(null, '{"age":37,}');
            // mistakenly sent invalid json
          }

        };
        module.handler.POST($);
  });

  it ("handler has no POST method if options has no create()", function(){
    // the router will 405 a collection POST if the handler doesn't 
    // implement .POST()
    var module = new JsonModule({
                                  list : function($, cb){ cb([]); }
                                  // missing create : function($, obj){ ... }
                                });

    should.not.exist(module.handler.POST);
  });
  it ("collection POST calls options.create()", function(done){
    var module = new JsonModule({
                                  list : function($, cb){ cb([]); },
                                   create : function($, obj){ 
                                     obj.should.eql({age:37});
                                     done();
                                   }
                                });
    var $ = {
      onBody : function(cb){
        cb(null, '{"age":37}');
      }
    };
    module.handler.POST($);
  });
  it ("collection POST calls options.create() and its callback if specified", function(done){
    var module = new JsonModule({
                                  list : function($, cb){ cb([]); },
                                  create : function($, obj, cb){ 
                                    obj.should.eql({age:37});
                                    return cb();
                                  }
                                });
    var $ = {
      status : {
        created : function(url){
          url.should.equal('self');
          done();
        }
      },
      uri : {
        self : function(){
          return 'self';
        }
      },
      onBody : function(cb){
        cb(null, '{"age":37}');
      }
    };
    module.handler.POST($);
  });
});
