var should = require('should');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var Percolator = require('../percolator');


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

  it ("passes options on to the context's 'app' namespace", function(done){
    var that = this;
    this.server = new Percolator({port : 3000});
    this.server.route('/', {  GET : function($){
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
    it ("can override the default port", function(done){
      var that = this;
      var port = 9090;  // set non-default here
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
    it ("parsed body gets added to the handler", function(done){
      var that = this;
      this.server = new Percolator({port : this.port});
      this.server.router.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  POST : function($){
                                    this.onBody(function(err, body){
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
    it ("parsed body gets added to the handler", function(done){
      var that = this;
      this.server = new Percolator({port : this.port, parseBody : true});
      this.server.router.route('/', {  GET : function($){
                                    $.res.end("Hello World!");
                                  },

                                  PUT : function($){
                                    this.body.thisisa.should.equal('TEST');
                                    this.rawBody.should.equal('{"thisisa":"TEST"}');
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
      this.server.router.route('/', {  GET : function($){
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
      this.server.router.route('/', {  GET : function($){
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
