var assert = require('assert');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var Percolator = require('../percolator');


function closeServer(server, cb){
    var timeout = setTimeout(cb, 1500); // not sure why, but travis-ci appears to need this.
    try {
      server.close(function(err){
        clearTimeout(timeout);
        return cb();
      });
    } catch(ex) {
      clearTimeout(timeout);
      return cb();
    }
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
    this.server.router.route('/', {  GET : function(req, res){
                                             res.end("Hello World!");
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
  });

  describe('#ctor', function(){
    it ("can override the default port", function(done){
      var that = this;
      var port = 9090;  // set non-default here
      this.server = new Percolator({port : port});
      this.server.router.route('/', {  GET : function(req, res){
                                               res.end("Hello World!");
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

  
  describe('when managing a body', function(){
    it ("responds 415 when Content-Type is unsupported", function(done){
      var that = this;
      this.server = new Percolator({port : this.port});
      this.server.router.route('/', {  GET : function(req, res){
                                    res.end("Hello World!");
                                  },

                                  PUT : function(req, res){
                                    res.end("Hello World!");
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
      this.server = new Percolator({port : this.port});
      this.server.router.route('/', {  GET : function(req, res){
                                    res.end("Hello World!");
                                  },

                                  PUT : function(req, res){
                                    res.end("Hello World!");
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
      this.server = new Percolator({port : this.port});
      this.server.router.route('/', {  GET : function(req, res){
                                    res.end("Hello World!");
                                  },

                                  PUT : function(req, res){
                                    res.end("Hello World!");
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
