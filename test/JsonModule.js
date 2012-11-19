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
  it ("throws an error if upsert() and update() both exist", function(){
    try {
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); },
                                    update : function($, id, obj){ },
                                    upsert : function($, id, obj){ }
                                   });
      should.fail("expected exception was not raised");
    } catch (ex){
      ex.should.equal("JsonModule should not have create() or update() if it has upsert().");
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
  describe("wildcard.DELETE", function(){
    it ("doesn't exist if options has no destroy()", function(){
      // the router will 405 a wildcard PUT if the handler doesn't
      // implement .PUT()
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); }
                                    // missing update : function($, id, obj){ ... }
                                   });

      should.not.exist(module.wildcard.DELETE);
    });
    it ("calls options.destroy()", function(done){
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); },
                                    destroy : function($, id, cb){ 
                                      id.should.equal('1234');
                                      done();
                                    }
                                  });
      var $ = {
        uri : {
          self : function(){
            return 'http://collection/1234';
          }
        }
      };
      module.wildcard.DELETE($);
    });
    it ("calls options.destroy() and its callback if specified", function(done){
      var headWritten = false;
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); },
                                    destroy : function($, id, cb){ 
                                      id.should.equal('1234');
                                      return cb();
                                    }
                                  });
      var $ = {
        res : {
          writeHead : function(code){
            headWritten = true;
            code.should.equal(204);
          },
          end : function(){
            headWritten.should.equal(true);
            done();
          }
        },
        uri : {
          self : function(){
            return 'http://collection/1234';
          }
        },
        onBody : function(cb){
          cb(null, '{"age":37}');
        }
      };
      module.wildcard.DELETE($);
    });
  });
  describe("wildcard.PUT", function(){
    it ("doesn't exist if options has no update() or upsert()", function(){
      // the router will 405 a wildcard PUT if the handler doesn't
      // implement .PUT()
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); }
                                    // missing update : function($, id, obj){ ... }
                                   });
      should.not.exist(module.wildcard.PUT);
    });
    it ("calls options.upsert() if it exists", function(done){
      var schema = {
        "name" : "name"
      };
      var module = new JsonModule({
                                    schema : schema,
                                    list : function($, cb){ cb([]); },
                                    upsert : function($, id, obj){ 
                                      obj.should.eql({age:37});
                                      done();
                                    }
                                  });
      var $ = {
        uri : {
          self : function(){
            return 'http://collection/1234';
          }
        },
        onJson : function(schema, cb){
          schema.should.eql(schema);
          cb(null, {"age":37});
        }
      };
      module.wildcard.PUT($);
    });
    it ("calls options.upsert() with its callback if it exists", function(done){
      var headerSet = false;
      var headWritten = false;
      var schema = {
        "name" : "name"
      };
      var module = new JsonModule({
                                    schema : schema,
                                    list : function($, cb){ cb([]); },
                                    upsert : function($, id, obj, cb){ 
                                      obj.should.eql({age:37});
                                      cb();
                                    }
                                  });
      var $ = {
        uri : {
          self : function(){
            return 'http://collection/1234';
          }
        },
        res : {
          setHeader : function(name, value){
            headerSet = true;
            name.should.equal('Location');
            value.should.equal('http://collection/1234');
          },
          writeHead : function(code){
            headWritten = true;
            code.should.equal(303);
          },
          end : function(){
            headerSet.should.equal(true);
            headWritten.should.equal(true);
            done();
          }
        },
        onJson : function(schema, cb){
          schema.should.eql(schema);
          cb(null, {"age":37});
        }
      };
      module.wildcard.PUT($);
    });
    it ("calls options.update()", function(done){
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); },
                                     update : function($, id, obj){ 
                                       id.should.equal('1234');
                                       obj.should.eql({age:37});
                                       done();
                                     }
                                  });
      var $ = {
        uri : {
          self : function(){
            return 'http://collection/1234';
          }
        },
        onJson : function(schema, cb){
          // TODO: verify schema
          cb(null, {"age":37});
        }
      };
      module.wildcard.PUT($);
    });
    it ("calls options.update() and its callback if specified", function(done){
      var headerSet = false;
      var headWritten = false;
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); },
                                    update : function($, id, obj, cb){ 
                                      id.should.equal('1234');
                                      obj.should.eql({age:37});
                                      return cb();
                                    }
                                  });
      var $ = {
        res : {
          setHeader : function(name, value){
            headerSet = true;
            name.should.equal('Location');
            value.should.equal('http://collection/1234');
          },
          writeHead : function(code){
            headWritten = true;
            code.should.equal(303);
          },
          end : function(){
            headerSet.should.equal(true);
            headWritten.should.equal(true);
            done();
          }
        },
        uri : {
          self : function(){
            return 'http://collection/1234';
          }
        },
        onJson : function(schema, cb){
          //TODO verify schema
          cb(null, {"age":37});
        }
      };
      module.wildcard.PUT($);
    });
  });
  describe("handler.POST", function(){
    it ("doesn't exist if options has no create()", function(){
      // the router will 405 a collection POST if the handler doesn't 
      // implement .POST()
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); }
                                    // missing create : function($, obj){ ... }
                                  });

      should.not.exist(module.handler.POST);
    });
    it ("calls options.create()", function(done){
      var module = new JsonModule({
                                    list : function($, cb){ cb([]); },
                                     create : function($, obj){ 
                                       obj.should.eql({age:37});
                                       done();
                                     }
                                  });
      var $ = {
        onJson : function(schema, cb){
          //TODO: verify schema
          cb(null, {"age":37});
        }
      };
      module.handler.POST($);
    });
    it ("calls options.create() and its callback if specified", function(done){
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
        onJson : function(schema, cb){
          //TODO: verify schema
          cb(null, {"age":37});
        }
      };
      module.handler.POST($);
    });
  });
});
