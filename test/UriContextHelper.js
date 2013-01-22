var should = require('should');
var mockery = require('mockery');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var UriContextHelper = require('../index').UriContextHelper;

describe('UriContextHelper', function(){
  afterEach(function(done){
    mockery.deregisterAll();
    done();
  });

  describe('#query', function(){
    it ("returns an object representation of the request query string", function(){
      var u = new UriContextHelper({}, '[path]?asdf=12%2020&g=c#somehash');
      u.query().should.eql({asdf : '12 20', g : 'c'});
    });
    it ("returns an object representation of the input query string", function(){
      var u = new UriContextHelper({}, 'asdf.com');
      u.query('[path]?asdf=12%2020&g=c#somehash').should.eql({asdf : '12 20', g : 'c'});
    });
    it ("returns an empty object when there is no querystring", function(){
      var u = new UriContextHelper({}, 'asdf.com');
      u.query().should.eql({});
    });
  });

  describe('#queryString', function(){
    it ("returns a querystring from a hash", function(){
      var u = new UriContextHelper({}, 'asdf.com');
      u.queryString({asdf : '12 20', g : 'c'}).should.eql('?asdf=12%2020&g=c');
    });
  });

  describe('#urlEncode', function(){
    it ("returns a url-encoded version of its input string", function(){
      var u = new UriContextHelper({}, '[path]');
      u.urlEncode("this is a test").should.equal("this%20is%20a%20test");
    });
  });
  describe('#urlDecode', function(){
    it ("returns a url-decoded version of its input string", function(){
      var u = new UriContextHelper({}, '[path]');
      u.urlDecode("this%20is%20a%20test").should.equal("this is a test");
    });
  });
  describe('#pathJoin', function(){
    it ("returns a single path from strings and arrays of strings", function(){
      var u = new UriContextHelper({}, '[path]');
      u.pathJoin(['qwer', '/asdf'], 'qwer/1234/', '/1234/')
              .should.equal('/qwer/asdf/qwer/1234/1234');
    });
    it ("returns a single path, even if the first is a full url ", function(){
      var u = new UriContextHelper({}, '[path]');
      u.pathJoin(['http://qwer.ca:8080/gg', '/asdf'], 'qwer/1234/', '/1234/')
              .should.equal('http://qwer.ca:8080/gg/asdf/qwer/1234/1234');
    });
  });
  describe('#get', function(){
    it ("returns the current url if there are no parameters", function(){
      var router = {};
      var u = new UriContextHelper(router, '[path]');
      u.get().should.equal('[path]');
    });
    it ("calls the router's getUrl if it has one parameter", function(){
      var called = false;
      var router = { getUrl : function(url){
        called = true;
        return url;
      } };
      var u = new UriContextHelper(router, '[path]');
      u.get('somename').should.equal('http://localhost/somename');
      called.should.equal(true);
    });
    it ("calls the router's getUrl if it has two parameters", function(){
      var called = false;
      var router = { getUrl : function(url, vars){
        called = true;
        return url + '_' + vars.var1;
      } };
      var u = new UriContextHelper(router, '[path]');
      u.get('somename', {var1 : 'val1'}).should.equal('http://localhost/somename_val1');
      called.should.equal(true);
    });
  });
  describe('#param', function(){
    it ("calls the router's pathVariables(self) and returns the urldecoded value for the given key", function(){
      var called = false;
      var router = { pathVariables : function(url){
        called = true;
        return {"url" : url};
      } };
      var u = new UriContextHelper(router, '[path]');
      u.param("url").should.eql('[path]');
      called.should.equal(true);
    });
    it ("calls the router's pathVariables(self) and returns a default if key doesn't exist", function(){
      var called = false;
      var router = { pathVariables : function(url){
        called = true;
        return {"url" : url};
      } };
      var u = new UriContextHelper(router, '[path]');
      u.param("noexist", "somedefault").should.eql('somedefault');
      called.should.equal(true);
    });
  });
  describe('#params', function(){
    it ("calls the router's pathVariables() with self url", function(){
      var called = false;
      var router = { pathVariables : function(url){
        called = true;
        return {"url" : url};
      } };
      var u = new UriContextHelper(router, '[path]');
      u.params().should.eql({"url" : '[path]'});
      called.should.equal(true);
    });
    it ("calls the router's pathVariables() with the passed url", function(){
      var called = false;
      var router = { pathVariables : function(url){
        called = true;
        return {"url" : url};
      } };
      var u = new UriContextHelper(router, '[path]');
      u.params('[some passed url]').should.eql({"url" : '[some passed url]'});
      called.should.equal(true);
    });
  });
  describe('#parent', function(){
    it ("calls the router's getParentUrl() with the current url", function(){
      var called = false;
      var router = { getParentUrl : function(str){
        called = true;
        return "[parent of " + str + "]";
      } };
      var u = new UriContextHelper(router, '[path]');
      u.parent().should.equal("http://localhost/[parent of [path]]");
      called.should.equal(true);
    });
    it ("calls the router's getParentUrl() with a passed url", function(){
      var called = false;
      var router = { getParentUrl : function(str){
        called = true;
        return "[parent of " + str + "]";
      } };
      var u = new UriContextHelper(router, '[path]');
      u.parent('[other path]').should.equal("http://localhost/[parent of [other path]]");
      called.should.equal(true);
    });
  });
  describe('#absolute', function(){
    it ('returns the input path with the hostname', function(){
      var router = { };
      var u = new UriContextHelper(router, '[path]', 'protocol', 'host.com');
      u.absolute('input').should.equal('protocol://host.com/input');
    });
  });
  describe('#queryClear', function(){
    it ("removes the query string from a url that has one", function(){
      var router = { };
      var u = new UriContextHelper(router, '/?asdf=1234&abcde=fghij#qwer');
      u.queryClear().should.equal('http://localhost/');
    });
    it ("does nothing to urls without query strings", function(){
      var router = { };
      var u = new UriContextHelper(router, '/?asdf=1234&abcde=fghij#qwer');
      u.queryClear().should.equal('http://localhost/');
    });
    it ("removes the query string from a given url", function(){
      var router = { };
      var u = new UriContextHelper(router, '/?asdf=1234&abcde=fghij#qwer');
      u.queryClear('/also/a/test/?this=will&not=work').should.equal('http://localhost/also/a/test/');
    });
  });
  describe('#queryMerge', function(){
    it ("merges a query object into the current querystring", function(){
      var router = { };
      var u = new UriContextHelper(router, '/?asdf=1234&abcde=fghij#qwer');
      u.queryMerge({test:'spa ce',asdf:4567,abcde:null}).should.equal('http://localhost/?asdf=4567&test=spa%20ce');
    });
  });
  describe('#child', function(){
    it ("returns the given string as a sub path of self", function(){
      var router = { };
      var u = new UriContextHelper(router, '[path]');
      u.child('asdf').should.equal('http://localhost/[path]/asdf');
    });
    it ("strips querystrings if applicable", function(){
      var router = { };
      var u = new UriContextHelper(router, 'http://localhost/tyui/tyui?qwer=qwer');
      u.child('asdf').should.equal('http://localhost/tyui/tyui/asdf');
    });
    it ("strips hash bookmarks if applicable", function(){
      var router = { };
      var u = new UriContextHelper(router, '/asdf/asdf/#qwer');
      u.child('asdf').should.equal('http://localhost/asdf/asdf/asdf');
    });

  });
  describe('#pathEnd', function(){
    it ("returns the last subdirectory directory in the path", function(){
      var router = { };
      var u = new UriContextHelper(router, '[path]');
      u.pathEnd('[path]/parent/sub/baby?asdf=qwer#hash').should.equal('baby');
    });
    it ("returns the last subdirectory directory in the path when the path ends witha  slash", function(){
      var router = { };
      var u = new UriContextHelper(router, '[path]');
      u.pathEnd('[path]/parent/sub/baby/?asdf=qwer#hash').should.equal('baby');
    });

  });
  describe('#self', function(){
    it ('returns the input url', function(){
      var router = { };
      var u = new UriContextHelper(router, '[path]');
      u.self().should.equal('http://localhost/[path]');
    });
    it ('returns the input url even with a querystring', function(){
      var router = { };
      var u = new UriContextHelper(router, '[path]?asdf=1234');
      u.self().should.equal('http://localhost/[path]?asdf=1234');
    });
  });
  describe('#parse', function(){
    it ('returns the value of url.parse for the current url', function(){
      var router = { };
      var u = new UriContextHelper(router, 'http://asdf.com:8080/asdf/1234?q=test&g=c#hashhh');
      var parsed = u.parse();
      parsed.hostname.should.equal('asdf.com');
      parsed.hash.should.equal('#hashhh');
    });
  });
});
