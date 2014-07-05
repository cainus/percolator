var assert = require('assert');
var nodeUrl = require('url');
var urlgrey = require('urlgrey');
var JsonStatus = require('json-status');
var HyperjsonConnect = require('hyperjson-connect');
var FetchHelper = require('../index').FetchHelper;
var _ = require('underscore');
var detour = require('detour');

var ContextFaker = function(method, url, headers, body){
  this._method = method || 'GET';
  this._url = url || '/';
  this._headers = headers || {};
  this._body = body || '';
  this.expect = this._expectObject();
  this.expectations = {};
  this._refreshFake();
  this.$ = {};
};

ContextFaker.prototype._refreshFake = function(){
  this.$ = new ContextFake(this._method,
                              this._url,
                              this._headers,
                              this._body,
                              this.expectations,
                              this.done);
  this.req = this.$.req;
  this.res = this.$.res;
};

ContextFaker.prototype.route = function(module, done){
  var req = this.req;
  var res = this.res;
  var body = this._body;
  this.$.done = done;
  FetchHelper(req, res, module, function(){
    module[req.method](req, res);
    req.end(body);
  });
};

ContextFaker.prototype.headers = function(headers){
  this._headers = headers;
  this._refreshFake();
  return this;
};
ContextFaker.prototype.header = function(name, value){
  this._headers[name] = value;
  this._refreshFake();
  return this;
};
ContextFaker.prototype.url = function(url){
  this._url = url;
  this._refreshFake();
  return this;
};
ContextFaker.prototype.method = function(method){
  this._method = method;
  this._refreshFake();
  return this;
};
ContextFaker.prototype.body = function(thebody){
  this._body = thebody;
  this._refreshFake();
  return this;
};

ContextFaker.prototype._expectObject = function(){
  var faker = this;
  return {
    statusCode : function(code){
      faker.expectations.statusCode = code;
      return faker;
    },
    body : function(bodyVal){
      faker.expectations.body = bodyVal;
      return faker;
    },
    header : function(name, value){
      faker.expectations.headers[name] = value;
      return faker;
    }
  };
};

var ContextFake = function(method, url, headers, body, expectations){
  var fake = this;
  var parsedUrl = nodeUrl.parse(url);
  var protocol = 'http';
  if (parsedUrl.protocol){
    this.protocol = parsedUrl.protocol.slice(0, -1);
    // remove trailing ':'
  }
  var hostname = parsedUrl.hostname || 'localhost';
  var port = parsedUrl.port || 80;
  this.router = {
  };  
  this.done = function(){};
  var endHandler = function(){};
  var dataHandler = function(){};
  this.req = {
    app : {},
    headers : headers,
    method : method,
    url : url,
    uri : urlgrey(url),
    resume : function(){},
    on : function(eventName, cb){
      if (eventName === 'data'){
        dataHandler = cb;
      }
      if (eventName === 'end'){
        endHandler = cb;
      }
    },
    write : function(data){
      dataHandler(data);
    },
    end : function(data){
      endHandler(data);
    }
  };
  this.actual = {};
  this.actual.body = '';
  this.actual.headers = {};
  this.res = {
    writeHead : function(statusCode, reasonPhrase, headers){
      fake.res.statusCode = statusCode;
      fake.actual.statusCode = statusCode;
      fake.actual.headers = _.extend(fake.actual.headers, headers);
    },
    setHeader : function(name, value){
      fake.actual.headers[name] = value;
    },
    statusCode : 200,
    write : function(data, encoding){
      fake.actual.body += data;
    },
    end : function(data, encoding){
      fake.actual.statusCode = fake.res.statusCode;
      if (data){
        fake.actual.body += data;
      }
      fake.validate();
      if (fake.done){
        fake.done(fake.actual);
      }
    }
  };
  var that = this;
  HyperjsonConnect({'protocol' : this.protocol})(this.req, this.res, function(){
    that.res.status = JsonStatus(that.req, that.res);
    //TODO can validate() be hidden?  it's only called from res.end() right?
    // does it ever need to be called explicitly?
    that.validate = function(){
      if (expectations.statusCode){
        assert.equal(that.res.statusCode,
                     expectations.statusCode,
                     "response statusCode should have been " +
                       expectations.statusCode +
                       " but was " +
                       that.res.statusCode
                       );
      }
      if (expectations.body){
        assert.equal(that.actual.body,
                     expectations.body,
                     "response body should have been: \n " +
                       expectations.body +
                       "\n\n ...but was: \n" +
                       that.actual.body + "\n\n"
                       );
      }
    };
  });
};

module.exports = ContextFaker;



