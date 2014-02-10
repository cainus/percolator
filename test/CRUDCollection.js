var Percolator = require('../index').Percolator;
var CRUDCollection = require('../index').CRUDCollection;
var should = require('should');
var urlgrey = require('urlgrey');
var ContextFaker = require('../index').ContextFaker;
var hottap = require('hottap').hottap;
var request = require('request');
var jobNumber = process.env.TRAVIS_JOB_NUMBER || '0.0';
var port = 8000 + parseInt(jobNumber.split(".")[1], 10);

describe("CRUDCollection", function(){
    it ("sets fetch on wildcard if fetch is defined", function(){
      var headerSet = false;
      var headWritten = false;
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ 
                                      cb([]); 
                                    },
                                    fetch : function(req, res, cb){
                                      console.log("something happened");
                                    }
                                  });
      should.exist(module.wildcard.fetch);
    });
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
                                      list : function(req, res, cb){ cb(null, [{"an" : "item"}]); },
                                      create : function(req, res, obj){ },
                                      schema : { troof : true}
                                    });
        var req = {
            uri : urlgrey('http://self.com/coll'),
            app : {
              autoLink : true
            }
          };
        var res = {
            collection : function(){
                return {
                  linkEach : function(rel, cb){
                    return {
                      link : function(rel, href, opts){
                        rel.should.equal('create');
                        href.toString().should.equal('http://self.com/coll');
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
        module.handler.GET(req, res);
    });
    it ("collection GET outputs a create link with no query string even if self has one", 
      function(done){
        var module = new CRUDCollection({
                                      list : function(req, res, cb){ cb(null, [{"an" : "item"}]); },
                                      create : function(req, res, obj){ },
                                      schema : { troof : true}
                                    });
        var req = {
            app : {
              autoLink : true
            },
            uri : urlgrey('http://self.com/coll?asdf=asdf')
          };
        var res = {
            collection : function(){
              return {
                linkEach : function(rel, cb){
                  return {
                    link : function(rel, href, opts){
                      rel.should.equal('create');
                      href.toString().should.equal('http://self.com/coll');
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
        module.handler.GET(req, res);
    });
  });
  describe("collection.GET", function(){
    it ("creates self links in all items", function(done){
      var module = new CRUDCollection({
                    list : function(req, res, cb){
                      cb(null, { sometest : {"here" : "goes"}}); 
                    }
                   });
      var req = {
          app : {
            autoLink : true
          },
					uri : urlgrey('http://localhost:8080/')
        };
      var res = {
          collection : function(items){
            items.should.eql({ sometest: { here: 'goes' } });
            return {
              linkEach : function(rel, strategy){
                rel.should.equal('self');
								strategy({here : 'goes'}, 'somename').toString()
										.should.equal('http://localhost:8080/somename');
                return {
                  send : function(){
                    done();
                  }
                };
              }
            };
          }
      };
      module.handler.GET(req, res);
    });
    it ("creates self links in all items based on a given key", function(done){
      var module = new CRUDCollection({
                    list : function(req, res, cb){
                      cb(null, { sometest : {"here" : "goes"}}, {key : 'here'}); 
                    }
                   });
      var req = {
          app : {
            autoLink : true
          },
					uri : urlgrey('http://localhost:8080/')
        };
      var res = {
          collection : function(items){
            items.should.eql({ sometest: { here: 'goes' } });
            return {
              linkEach : function(rel, strategy){
                rel.should.equal('self');
								strategy({here : 'goes'}, 'somename').toString()
										.should.equal('http://localhost:8080/goes');
                return {
                  send : function(){
                    done();
                  }
                };
              }
            };
          }
      };
      module.handler.GET(req, res);
    });
    it ("returns a 500 if the callback gets an error", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb("some error!"); }
                                   });
      var req = {
          app : {
            autoLink : true
          }
        };
      var res = {
					status : {
						internalServerError : function(msg){
							msg.should.equal("some error!");
							done();
						}
					}
      };
      module.handler.GET(req, res);
    });
  });
  describe("wildcard.DELETE", function(){
    it ("doesn't exist if options has no destroy()", function(){
      // the router will 405 a wildcard PUT if the handler doesn't
      // implement .DELETE()
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); }
                                    // missing destroy : function(req, res, id, obj){ ... }
                                   });

      should.not.exist(module.wildcard.DELETE);
    });
    it ("calls options.destroy()", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    destroy : function(req, res, id, cb){ 
                                      id.should.equal('1234');
                                      done();
                                    }
                                  });
      var req = {
          uri : urlgrey('http://self.com/coll/1234')
      };
      var res = {};
      module.wildcard.DELETE(req, res);
    });
    it ("calls options.destroy() and its callback if specified", function(done){
      var headWritten = false;
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    destroy : function(req, res, id, cb){ 
                                      id.should.equal('1234');
                                      return cb();
                                    }
                                  });
      var res = {
          writeHead : function(code){
            headWritten = true;
            code.should.equal(204);
          },
          end : function(){
            headWritten.should.equal(true);
            done();
          }
      };
      var req = {
        uri : urlgrey('http://self.com/coll/1234'),
        onBody : function(cb){
          cb(null, '{"age":37}');
        }
      };
      module.wildcard.DELETE(req, res);
    });
  });
  describe("wildcard.PUT", function(){
    it ("doesn't exist if options has no update() or upsert()", function(){
      // the router will 405 a wildcard PUT if the handler doesn't
      // implement .PUT()
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); }
                                    // missing update : function(req, res, id, obj){ ... }
                                   });
      should.not.exist(module.wildcard.PUT);
    });
    it ("calls options.upsert() if it exists", function(done){
      var schema = {
        "name" : "name"
      };
      var module = new CRUDCollection({
                                    schema : schema,
                                    list : function(req, res, cb){ cb([]); },
                                    upsert : function(req, res, id, obj){ 
                                      obj.should.eql({age:37});
                                      done();
                                    }
                                  });
      var req = {
          uri : urlgrey('http://self.com/coll/1234'),
          onJson : function(schema, cb){
            schema.should.eql(schema);
            cb(null, {"age":37});
          }
      };
      var res = {};
      module.wildcard.fetchOnPUT.should.equal(false);
      module.wildcard.PUT(req, res);
    });
    it ("automatically handles an error in json parsing for options.upsert()", function(done){
      var headerSet = false;
      var headWritten = false;
      var schema = {
        "name" : "name"
      };
			var upsertWasCalled = false;
      var module = new CRUDCollection({
                                    schema : schema,
                                    list : function(req, res, cb){ cb(null, []); },
                                    upsert : function(req, res, id, obj, cb){ 
																			upsertWasCalled = true;
                                    }
                                  });
			console.log("testing with port: ", port);
			var app = { port : port };
			var server = new Percolator(app);
			server.route('/', module.handler);
			server.route('/:item', module.wildcard);
			server.listen(function(err){
				if (err) {console.log(err);throw err;}
				request({method : 'PUT',
                 uri : "http://localhost:" + port + "/1234",
                 headers : {"Content-Type" : "application/json"},
                 body : '{"sadf" : "asd f字"'},   // incomplete json
                   function(err, response, body){
					should.not.exist(err);
					response.statusCode.should.equal(400);
					JSON.parse(response.body)
						.should
						.eql({"error":{"type":400,"message":"Bad Request","detail":"invalid json."}});
					upsertWasCalled.should.equal(false);
					server.close(function(){
						done();
					});
				});
			});
    });
    it ("calls options.upsert() with its callback if it exists", function(done){
      var headerSet = false;
      var headWritten = false;
      var schema = {
        "name" : "name"
      };
      var module = new CRUDCollection({
                                    schema : schema,
                                    list : function(req, res, cb){ cb([]); },
                                    upsert : function(req, res, id, obj, cb){ 
                                      obj.should.eql({age:37});
                                      cb();
                                    }
                                  });
      var req = {
          uri : urlgrey('http://self.com/coll/1234'),
          onJson : function(schema, cb){
            schema.should.eql(schema);
            cb(null, {"age":37});
          }
      };
      var res = {
          setHeader : function(name, value){
            headerSet = true;
            name.should.equal('Location');
            value.toString().should.equal('http://self.com/coll/1234');
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
      };
      module.wildcard.PUT(req, res);
    });
    it ("calls options.update()", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                     update : function(req, res, id, obj){ 
                                       id.should.equal('1234');
                                       obj.should.eql({age:37});
                                       done();
                                     }
                                  });
      var req = {
          uri : urlgrey('http://self.com/coll/1234'),
          onJson : function(schema, cb){
            // TODO: verify schema
            cb(null, {"age":37});
          }
      };
      var res = {};
      module.wildcard.fetchOnPUT.should.equal(true);
      module.wildcard.PUT(req, res);
    });
    it ("calls options.update() and its callback if specified", function(done){
      var headerSet = false;
      var headWritten = false;
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    update : function(req, res, id, obj, cb){ 
                                      id.should.equal('1234');
                                      obj.should.eql({age:37});
                                      return cb();
                                    }
                                  });
      var req = {
                  uri : urlgrey('http://self.com/coll/1234'),
                  onJson : function(schema, cb){
                    //TODO verify schema
                    cb(null, {"age":37});
                  }
                };
      var res = {
                  setHeader : function(name, value){
                    headerSet = true;
                    name.should.equal('Location');
                    value.toString().should.equal('http://self.com/coll/1234');
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
      };
      module.wildcard.PUT(req, res);
    });
  });
  describe("handler.GET", function(){
    it("is defined when collectionGET is defined", function(done){
      var module = new CRUDCollection({
                                    collectionGET : function(req, res){ done(); }
                                    // missing fetch and memberGET
                                  });

      should.exist(module.handler.GET);
      var req = {};
      var res = {};
      module.handler.GET(req, res);
    });
  });
  describe("wildcard.GET", function(){
    it ("doesn't exist if there's no fetch() or memberGET", function(){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); }
                                    // missing fetch and memberGET
                                  });

      should.not.exist(module.wildcard.GET);

    });
    it ("does not output an update link if there's no update()", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    fetch : function(req, res, cb){
                                                cb(null, {"some":"obj"});
                                            },
                                    updateSchema : {
                                      name : "somename"
                                    }
                                  });

      var req = {
          uri : urlgrey('http://self.com/coll/1234'),
          fetched : {"some":"obj"}
      };
      var res = {
          object : function(obj){
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
      module.wildcard.GET(req, res);

    });
    it ("outputs a representation of a resource when fetch is defined", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    fetch : function(req, res, cb){ 
                                                cb(null, {"some":"obj"});
                                            }
                                  });

      var req = {
          uri : urlgrey('http://self.com/coll/1234'),
          fetched : {"some":"obj"}
      };
      var res = {
          object : function(obj){
            obj.should.eql({'some':'obj'});
            return {
              send : function(thing){
                done();
              }
            };
          }
      };
      module.wildcard.GET(req, res);

    });
    it ("outputs without an update link if update() is not defined", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    fetch : function(req, res, cb){
                                                cb(null, {"some":"obj"});
                                            },
                                    updateSchema : {
                                      name : "somename"
                                    }
                                  });

      var req = {
          uri : urlgrey('http://self/1234'),
          fetched : {"some":"obj"}
      };
      var res = {
          object : function(obj){
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
      module.wildcard.GET(req, res);

    });
    it ("outputs with an update link if update() is defined", function(done){
      var createdUpdateLink = false;
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    fetch : function(req, res, cb){
                                                cb(null, {"some":"obj"});
                                            },
                                    update : function(){},
                                    updateSchema : {
                                      name : "somename"
                                    }
                                  });

      var req = {
          app : {
            autoLink : true
          },
          fetched : {"some":"obj"},
          uri : urlgrey('http://self/1234')
        };
      var res = {
          object : function(obj){
            obj.should.eql({'some':'obj'});
            return {
              send : function(thing){
                createdUpdateLink.should.equal(true);
                done();
              },
              link : function(rel, href, opts){
                createdUpdateLink = true;
                rel.should.equal("update");
                href.toString().should.equal("http://self/1234");
                opts.should.eql({method : 'PUT', schema : { name : "somename"}});
              }
            };
          }
      };
      module.wildcard.GET(req, res);

    });
    it ("outputs with a delete link if destroy() is defined", function(done){
      var createdDeleteLink = false;
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    fetch : function(req, res, cb){
                                                cb(null, {"some":"obj"});
                                            },
                                    destroy : function(){}
                                  });
      var req = {
          app : {
            autoLink : true
          },
          fetched : {"some":"obj"},
          uri : urlgrey('http://self/1234')
      };
      var res = {
          object : function(obj){
            obj.should.eql({'some':'obj'});
            return {
              send : function(thing){
                createdDeleteLink.should.equal(true);
                done();
              },
              link : function(rel, href, opts){
                createdDeleteLink = true;
                rel.should.equal("delete");
                href.toString().should.equal("http://self/1234");
                opts.should.eql({method : 'DELETE'});
              }
            };
          }
      };
      module.wildcard.GET(req, res);

    });
    it ("is defined when memberGET is defined", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    memberGET : function(req, res){ 
                                      done();
                                    }
                                  });

      var req = { };
      var res = { };
      module.wildcard.GET(req, res);

    });

  });
  describe("handler.POST", function(){
    it ("doesn't exist if options has no create()", function(){
      // the router will 405 a collection POST if the handler doesn't 
      // implement .POST()
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); }
                                    // missing create : function(req, res, obj){ ... }
                                  });

      should.not.exist(module.handler.POST);
    });
    it ("calls options.create()", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                     create : function(req, res, obj){ 
                                       obj.should.eql({age:37});
                                       done();
                                     }
                                  });
      var req = {
          onJson : function(schema, cb){
            //TODO: verify schema
            cb(null, {"age":37});
          }
      };
      var res = {};
      module.handler.POST(req, res);
    });
    it ("calls options.create() and its callback if specified", function(done){
      var module = new CRUDCollection({
                                    list : function(req, res, cb){ cb([]); },
                                    create : function(req, res, obj, cb){ 
                                      obj.should.eql({age:37});
                                      return cb();
                                    }
                                  });
      var req = {
          uri : urlgrey('http://self/1234'),
          onJson : function(schema, cb){
            //TODO: verify schema
            cb(null, {"age":37});
          }
      };
      var res = {
          status : {
            created : function(url){
              url.toString().should.equal('http://self/1234');
              done();
            }
          }
      };
      module.handler.POST(req, res);
    });
  });
});
