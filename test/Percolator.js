var should = require('should');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var Percolator = require('../index').Percolator;


/*
TODO : 
   tarantula - finds undocumented rels, unhittable endpoints, api errors, valid urls
   viewer like jsonviewer
   api time-cost report
   how to document rels easily?
 */

function closeServer(server, cb){
  if (!!server){
    try {
      server.close();
    } catch(ex){

    }
  }
  return cb();
}


describe('Percolator', function(){
  beforeEach(function(done){
    this.port = 3000;
    if (!this.server){ 
      this.server = null;
    }
    closeServer(this.server, done);
  });
  afterEach(function(done){
    closeServer(this.server, done);
  });


  it("has default error handlers for 404s", function(done){
      var that = this;
      var url = "http://localhost:3000/DOES_NOT_EXIST";
      this.server = new Percolator({port : 3000});
      this.server.route('/', {  GET : function($){
                                               $.res.end("Hello World!");
                                             }});
    this.server.listen(function(err){
      if (err) {
        console.log("listen err: ", err);
        throw err;
      }
      hottap(url).request("GET",
                               function(err, response){
                                 response.status.should.equal(404);
                                 JSON.parse(response.body).error.type.should.equal(404);
                                 should.not.exist(err);
                                 done();
                               });
    });
  });
  it("has default error handlers for 405s", function(done){
      var that = this;
      var url = "http://localhost:3000/";
      this.server = new Percolator({port : 3000});
      this.server.route('/', {  GET : function($){
                                               $.res.end("Hello World!");
                                             }});
    this.server.listen(function(err){
      if (err) {
        console.log("listen err: ", err);
        throw err;
      }
      hottap(url).request("DELETE",
                               function(err, response){
                                 response.status.should.equal(405);
                                 JSON.parse(response.body).error.type.should.equal(405);
                                 should.not.exist(err);
                                 done();
                               });
    });
  });
  it("has default error handlers for 501s", function(done){
      var that = this;
      var url = "http://localhost:3000/";
      this.server = new Percolator({port : 3000});
      this.server.route('/', {  GET : function($){
                                               $.res.end("Hello World!");
                                             }});
    this.server.listen(function(err){
      if (err) {
        console.log("listen err: ", err);
        throw err;
      }
      hottap(url).request("TRACE",
                               function(err, response){
                                 response.status.should.equal(501);
                                 JSON.parse(response.body).error.type.should.equal(501);
                                 should.not.exist(err);
                                 done();
                               });
    });
  });
  it("has a default error handler for 414s", function(done){
      var that = this;
      var bigpath = "1";
      _.times(4097, function(){bigpath += '1';});
      var url = "http://localhost:3000/" + bigpath;
      this.server = new Percolator({port : 3000});
      this.server.route('/', {  GET : function($){
                                               $.res.end("Hello World!");
                                             }});
    this.server.listen(function(err){
      if (err) {
        console.log("listen err: ", err);
        throw err;
      }
      hottap(url).request("GET",
                               function(err, response){
                                 response.status.should.equal(414);
                                 JSON.parse(response.body).error.type.should.equal(414);
                                 should.not.exist(err);
                                 done();
                               });
    });
  });

  it ("exposes an onRequest hook for additionally handling requests", function(done){
    var that = this;
    var url = "http://localhost:3000/";
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
                                             $.res.end("Hello World! " + $.decorated);
                                           }});
    this.server.onRequest(function(handler, context, cb){
      context.req.url.should.equal('/');
      context.decorated = true;
      cb(context);
    });
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      hottap(url).request("GET",
                               function(err, response){
                                 response.status.should.equal(200);
                                 response.body.should.equal("Hello World! true");
                                 done();
                               });
    });
  });

  it ("can respond to simple requests", function(done){
    var that = this;
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
                                             $.res.end("Hello World!");
                                           }});
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      var url = "http://localhost:" + that.server.port + "/";
      hottap(url).request("GET",
                               function(err, response){
                                  if (err) {
                                    throw err;
                                  }
                                  response.status.should.equal(200);
                                  done();
                               });
    });
  });

  it ("can respond to static requests", function(done){
    var that = this;
    var staticDir = __dirname + '/test_fixtures/static';
    this.server = new Percolator({port : 3000, staticDir : staticDir});
    this.server.route('/', {  GET : function($){
                                             $.res.end("Hello World!");
                                           }});
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      var url = "http://localhost:" + that.server.port + "/static.txt";
      hottap(url).request("GET",
                               function(err, response){
                                  if (err) {
                                    throw err;
                                  }
                                  response.status.should.equal(200);
                                  response.body.should.equal("Yep.\n");
                                  done();
                               });
    });
  });

  it ("throws an error when staticDir is set, but the dir doesn't exist.", function(done){
    var that = this;
    var staticDir = __dirname + '/test_fixtures/NO_EXIST';
    this.server = new Percolator({port : 3000, staticDir : staticDir});
    this.server.listen(function(err){
      if (err) {
        err.should.equal("Your staticDir path could not be found.");
        done();
      }
    });
  });
  it ("passes options on to the context's 'app' namespace", function(done){
    var that = this;
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
                                             should.exist($.app);
                                             $.app.port.should.equal(3000);
                                             $.res.end("Hello World!");
                                           }});
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      var url = "http://localhost:" + that.server.port + "/";
      hottap(url).request("GET",
                               function(err, response){
                                  if (err) {
                                    throw err;
                                  }
                                  response.status.should.equal(200);
                                  done();
                               });
    });
  });

  it ("adds a router reference to every context", function(done){
    var that = this;
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
                                             should.exist($.router);
                                             $.res.end("Hello World!");
                                           }});
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      var url = "http://localhost:" + that.server.port + "/";
      hottap(url).request("GET",
                               function(err, response){
                                  if (err) {
                                    throw err;
                                  }
                                  response.status.should.equal(200);
                                  done();
                               });
    });
  });

  it ("HEAD for a GET-only resource returns the same headers, blank resource", function(done){
    var that = this;
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
                                       $.res.setHeader('Content-Type', 'text/plain');
                                       $.res.end('yo yo yo');
                                     }});
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      var url = "http://localhost:" + that.server.port + "/";
      hottap(url).request("HEAD", 
                               function(err, response){
                                 if (err) {
                                   throw err;
                                 }
                                 response.headers['content-type'].should.equal('text/plain');
                                 response.body.should.equal("");
                                 response.status.should.equal(204);
                                 done();
                               });
    });
  });

  it ("OPTIONS for a GET-only resource returns, GET, HEAD, OPTIONS", function(done){
    var that = this;
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
                                             $.res.end("Hello World!");
                                           }});
    this.server.listen(function(err){
      if (err) {
        throw err;
      }
      var url = "http://localhost:" + that.server.port + "/";
      hottap(url).request("OPTIONS",
                               function(err, response){
                                  if (err) {
                                    throw err;
                                  }
                                  var body = JSON.parse(response.body);
                                  body['allowed methods'].should.eql(["OPTIONS","HEAD","GET"]);
                                  response.headers.allow.should.equal('OPTIONS,HEAD,GET');
                                  response.status.should.equal(200);
                                  done();
                               });
    });
  });

  // can't run this on travis-ci for some reason.  
  /*
  describe('#close', function(){
    it ("can close a listening server", function(done){
      this.server = new Percolator({port : this.port});
      var server = this.server;
      this.server.listen(function(err){
        server.close(function(err){
          done();
        });
      });
    });
  });*/

  describe('#ctor', function(){
    it("can be created", function(){
      var server = new Percolator({port : 3000});
      should.exist(server);
    });
    it ("can override the default port", function(done){
      var that = this;
      var port = 3001;  // set non-default here
      this.server = new Percolator({port : port});
      this.server.route('/', {  GET : function($){
                                            $.res.end("Hello World!");
                                }});
      this.server.listen(function(err){
        if (err) {
          throw err;
        }
        var url = "http://localhost:" + that.server.port + "/";
        hottap(url).request("GET",
                                 function(err, response){
                                    if (err) {
                                      throw err;
                                    }
                                    response.status.should.equal(200);
                                    done();
                                 });
      });
    });
  });

  
  describe('when managing a text/plain body', function(){
    it ("parsed body gets added to the context", function(done){
      var that = this;
      this.server = new Percolator({port : this.port});
      this.server.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  POST : function($){
                                    $.onBody(function(err, body){
                                      body.should.equal('wakka wakka wakka');
                                      $.res.end("Hello World!");
                                    });
                                  }});
      this.server.listen(function(err){
        if (err) {
          throw err;
        }
        hottap("http://localhost:" + that.server.port + "/").request("POST", 
                                                 {"content-type":"text/plain"},
                                                 'wakka wakka wakka',
                                                 function(err, response){
                                                    if (err) {
                                                      throw err;
                                                    }
                                                    response.status.should.equal(200);
                                                    response.body.should.equal("Hello World!");
                                                    done();
                                                 });
      });
    });
  });
  describe('when managing a json body', function(){
    it ("parsed body gets added to the context", function(done){
      var that = this;
      this.server = new Percolator({port : this.port, parseBody : true});
      this.server.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  PUT : function($){
                                    $.body.thisisa.should.equal('TEST');
                                    $.rawBody.should.equal('{"thisisa":"TEST"}');
                                    $.res.end("Hello World!");
                                  }});
      this.server.listen(function(err){
        if (err) {
          throw err;
        }
        hottap("http://localhost:" + that.server.port + "/").request("PUT", 
                                                 {"content-type":"application/json"},
                                                 '{"thisisa":"TEST"}',
                                                 function(err, response){
                                                    if (err) {
                                                      throw err;
                                                    }
                                                    response.status.should.equal(200);
                                                    response.body.should.equal("Hello World!");
                                                    done();
                                                 });
      });
    });
    it ("responds 415 when Content-Type is unsupported", function(done){
      var that = this;
      this.server = new Percolator({port : this.port, parseBody : true});
      this.server.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  PUT : function($){
                                    $.res.end("Hello World!");
                                  }});
      this.server.listen(function(err){
        if (err) {
          throw err;
        }
        hottap("http://localhost:" + that.server.port + "/").request("PUT", 
                                                 {"content-type":"application/whatwhat"},
                                                 "",
                                                 function(err, response){
                                                    if (err) {
                                                      throw err;
                                                    }
                                                    response.status.should.equal(415);
                                                    var parsed = JSON.parse(response.body);
                                                    parsed.error.type.should.equal(415);
                                                    parsed.error.message
                                                              .should.equal("Unsupported Media Type");
                                                    parsed.error.detail
                                                              .should.equal("application/whatwhat");
                                                    done();
                                                 });
      });
    });
    it ("responds 415 when Content-Type is missing on PUT", function(done){
      var that = this;
      this.server = new Percolator({port : this.port, parseBody : true});
      this.server.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  PUT : function($){
                                    $.res.end("Hello World!");
                                  }});
      this.server.listen(function(err){
        if (err) {
          throw err;
        }
        hottap("http://localhost:" + that.server.port + "/").request("PUT", 
                                                 {},
                                                 "",
                                                 function(err, response){
                                                    if (err) {
                                                      throw err;
                                                    }
                                                    response.status.should.equal(415);
                                                    var parsed = JSON.parse(response.body);
                                                    parsed.error.type.should.equal(415);
                                                    parsed.error.message
                                                              .should.equal("Unsupported Media Type");
                                                    parsed.error.detail
                                                              .should.equal("None provided.");
                                                    done();
                                                 });
      });
    });
    it ("responds 400 when Content-Type is json, but body doesn't contain JSON", function(done){
      var that = this;
      this.server = new Percolator({port : this.port, parseBody : true});
      this.server.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  PUT : function($){
                                    $.res.end("Hello World!");
                                  }});
      this.server.listen(function(err){
        if (err) {
          throw err;
        }
        hottap("http://localhost:" + that.server.port + "/").request("PUT", 
                                                 {'Content-Type' : 'application/json'},
                                                 "hey wait a minute. this isn't json",
                                                 function(err, response){
                                                    if (err) {
                                                      throw err;
                                                    }
                                                    response.status.should.equal(400);
                                                    var parsed = JSON.parse(response.body);
                                                    parsed.error.type.should.equal(400);
                                                    parsed.error.message
                                                              .should.equal("Bad Request");
                                                    parsed.error.detail
                                                              .should.match(/^Parse Error/);
                                                    done();
                                                 });
      });
    });
  });

});
