var CRUDCollection = require('../index').CRUDCollection;
var should = require('should');

describe("CRUDCollection", function(){
  it ("throws an exception if there's no list() or collectionGET() passed in the options param", function(){
    try {
      var module = new CRUDCollection({});
      should.fail("expected exception was not raised");
    } catch(ex){
      ex.should.equal("the options parameter should have a list() or collectionGET() function.");
    }

  });
  describe("when schema is set", function(){
    it ("collection GET outputs a create link", function(done){
        var module = new CRUDCollection({
                                      list : function($, cb){ cb(null, [{"an" : "item"}]); },
                                      create : function($, obj){ },
                                      schema : { troof : true}
                                    });
        var $ = {
          app : {
            autoLink : true
          },
          uri : {
            self : function(){ return 'http://self'; }
          },

          jsonCollection : function(){
            return {
              linkEach : function(rel, cb){
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
  describe("collection.GET", function(){
    it ("creates self links in all items", function(done){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb(null, { sometest : {"here" : "goes"}}); }
                                   });
      var $ = { 
        app : {
          autoLink : true
        },
        jsonCollection : function(items){
          items.should.eql({ sometest: { here: 'goes' } });
          return {
            linkEach : function(rel, cb){
              rel.should.equal('self');
              return {
                send : function(){
                  done();
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
      // implement .DELETE()
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); }
                                    // missing destroy : function($, id, obj){ ... }
                                   });

      should.not.exist(module.wildcard.DELETE);
    });
    it ("calls options.destroy()", function(done){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    destroy : function($, id, cb){ 
                                      id.should.equal('1234');
                                      done();
                                    }
                                  });
      var $ = {
        uri : {
          pathEnd : function(){
            return '1234';
          }
        }
      };
      module.wildcard.DELETE($);
    });
    it ("calls options.destroy() and its callback if specified", function(done){
      var headWritten = false;
      var module = new CRUDCollection({
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
          pathEnd : function(){
            return '1234';
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
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); }
                                    // missing update : function($, id, obj){ ... }
                                   });
      should.not.exist(module.wildcard.PUT);
    });
    it ("calls options.upsert() if it exists", function(done){
      var schema = {
        "name" : "name"
      };
      var module = new CRUDCollection({
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
          },
          pathEnd : function(){
            return '1234';
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
      var module = new CRUDCollection({
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
          },
          pathEnd : function(){
            return '1234';
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
      var module = new CRUDCollection({
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
          },
          pathEnd : function(){
            return '1234';
          }

        },
        onJson : function(schema, cb){
          // TODO: verify schema
          cb(null, {"age":37});
        }
      };
      module.wildcard.PUT($);
    });
    it ("doesn't call options.update() if fetch() fails with some error", function(done){
      var headerSet = false;
      var headWritten = false;
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    update : function($, id, obj, cb){ 
                                      should.fail('update should not be called');
                                    },
                                    fetch : function($, id, cb){
                                      id.should.equal('1234');
                                      cb("some error!");
                                    }
                                  });
      var $ = {
                uri : {
                  pathEnd : function(){
                    return '1234';
                  }
                },
                status : {
                  internalServerError : function(err){
                    err.should.equal('some error!');
                    done();
                  }
                }
              };
      module.wildcard.PUT($);
    });
    it ("doesn't call options.update() if fetch() doesn't find the uri", function(done){
      var headerSet = false;
      var headWritten = false;
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    update : function($, id, obj, cb){ 
                                      should.fail('update should not be called');
                                    },
                                    fetch : function($, id, cb){
                                      id.should.equal('1234');
                                      cb(true);  // returning strict true
                                                 // means "not found"
                                    }
                                  });
      var $ = {
                req : {
                  url : 'http://someurl'
                },
                uri : {
                  pathEnd : function(){
                    return '1234';
                  }
                },
                status : {
                  notFound : function(url){
                    url.should.equal('http://someurl');
                    done();
                  }
                }
              };
      module.wildcard.PUT($);
    });
    it ("calls options.update() and its callback if specified", function(done){
      var headerSet = false;
      var headWritten = false;
      var module = new CRUDCollection({
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
                  },
                  pathEnd : function(){
                    return '1234';
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
  describe("handler.GET", function(){
    it("is defined when collectionGET is defined", function(done){
      var module = new CRUDCollection({
                                    collectionGET : function($){ done(); }
                                    // missing fetch and memberGET
                                  });

      should.exist(module.handler.GET);
      var $ = {};
      module.handler.GET($);
    });
  });
  describe("wildcard.GET", function(){
    it ("doesn't exist if there's no fetch() or memberGET", function(){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); }
                                    // missing fetch and memberGET
                                  });

      should.not.exist(module.wildcard.GET);

    });
    it ("does not output an update link if there's no update()", function(done){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    fetch : function($, id, cb){
                                                id.should.equal(1234);
                                                cb(null, {"some":"obj"});
                                            },
                                    updateSchema : {
                                      name : "somename"
                                    }
                                  });

      var $ = {
        uri : {
          self : function(){return 'http://self';},
          pathEnd : function(){  return 1234; }
        },
        json : function(obj){
          obj.should.eql({'some':'obj'});
          return {
            send : function(thing){
              done();
            },
            link : function(rel, href, opts){
              console.log(arguments);
              should.fail("there should be no additional calls to link() because there's not update() method.");
            }
          };
        }
      };
      module.wildcard.GET($);

    });
    it ("outputs a representation of a resource when fetch is defined", function(done){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    fetch : function($, id, cb){ 
                                                id.should.equal(1234);
                                                cb(null, {"some":"obj"});
                                            }
                                  });

      var $ = {
        uri : {
          pathEnd : function(){  return 1234; }
        },
        json : function(obj){
          obj.should.eql({'some':'obj'});
          return {
            send : function(thing){
              done();
            }
          };
        }
      };
      module.wildcard.GET($);

    });
    it ("outputs without an update link if update() is not defined", function(done){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    fetch : function($, id, cb){
                                                id.should.equal(1234);
                                                cb(null, {"some":"obj"});
                                            },
                                    updateSchema : {
                                      name : "somename"
                                    }
                                  });

      var $ = {
        uri : {
          self : function(){return 'http://self';},
          pathEnd : function(){  return 1234; }
        },
        json : function(obj){
          obj.should.eql({'some':'obj'});
          return {
            send : function(thing){
              done();
            },
            link : function(rel, href, opts){
              should.fail("no link should be added!");
            }
          };
        }
      };
      module.wildcard.GET($);

    });

    it ("outputs with an update link if update() is defined", function(done){
      var createdUpdateLink = false;
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    fetch : function($, id, cb){
                                                id.should.equal(1234);
                                                cb(null, {"some":"obj"});
                                            },
                                    update : function(){},
                                    updateSchema : {
                                      name : "somename"
                                    }
                                  });

      var $ = {
        app : {
          autoLink : true
        },
        uri : {
          self : function(){return 'http://self';},
          pathEnd : function(){  return 1234; }
        },
        json : function(obj){
          obj.should.eql({'some':'obj'});
          return {
            send : function(thing){
              createdUpdateLink.should.equal(true);
              done();
            },
            link : function(rel, href, opts){
              createdUpdateLink = true;
              rel.should.equal("update");
              href.should.equal("http://self");
              opts.should.eql({method : 'PUT', schema : { name : "somename"}});
            }
          };
        }
      };
      module.wildcard.GET($);

    });
    it ("outputs with a delete link if destroy() is defined", function(done){
      var createdDeleteLink = false;
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    fetch : function($, id, cb){
                                                id.should.equal(1234);
                                                cb(null, {"some":"obj"});
                                            },
                                    destroy : function(){}
                                  });
      var $ = {
        app : {
          autoLink : true
        },
        uri : {
          self : function(){return 'http://self';},
          pathEnd : function(){  return 1234; }
        },
        json : function(obj){
          obj.should.eql({'some':'obj'});
          return {
            send : function(thing){
              createdDeleteLink.should.equal(true);
              done();
            },
            link : function(rel, href, opts){
              createdDeleteLink = true;
              rel.should.equal("delete");
              href.should.equal("http://self");
              opts.should.eql({method : 'DELETE'});
            }
          };
        }
      };
      module.wildcard.GET($);

    });
    it ("is defined when memberGET is defined", function(done){
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); },
                                    memberGET : function($){ 
                                      done();
                                    }
                                  });

      var $ = {
      };
      module.wildcard.GET($);

    });

  });
  describe("handler.POST", function(){
    it ("doesn't exist if options has no create()", function(){
      // the router will 405 a collection POST if the handler doesn't 
      // implement .POST()
      var module = new CRUDCollection({
                                    list : function($, cb){ cb([]); }
                                    // missing create : function($, obj){ ... }
                                  });

      should.not.exist(module.handler.POST);
    });
    it ("calls options.create()", function(done){
      var module = new CRUDCollection({
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
      var module = new CRUDCollection({
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
