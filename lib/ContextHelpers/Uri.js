var nodeUrl = require('url');
var querystring = require('querystring');
var _ = require('underscore');


// TODO:  this should take the form of a context helper:
// UriContextHelper(context, handler, cb)  which calls cb(err, context)
// Percolator.js needs to be changed to use it like a ContextHelper

var UriContextHelper = function(router, urlstr, protocol, host){
  this._router = router;
  this._self = urlstr;
  this._params = null;
  this._protocol = protocol || 'http';
  this._host = host || 'localhost';
};


UriContextHelper.prototype.absolute = function(path){
  if (path[0] == '/'){
    path = path.substring(1);
  }
  var parsed = nodeUrl.parse(path);
  if (!!parsed.protocol){  // if it's already absolute, just return it
    return path;
  }
  return this._protocol + "://" + this._host + '/' + path;
};

UriContextHelper.prototype.urlEncode = function(str){
  return querystring.escape(str);
};

UriContextHelper.prototype.urlDecode = function(str){
  return querystring.unescape(str);
};

UriContextHelper.prototype.query = function(inUrl){
  var url = inUrl || this._self;
  var parsed = nodeUrl.parse(url);
  if (!!parsed.search){
    var qstr = parsed.search.substring(1);
    return querystring.parse(qstr);
  }
  return {};
};

UriContextHelper.prototype.queryString = function(obj){
  var that = this;
  var pairs = _.map(obj, function(v, k){
    return that.urlEncode(k) + '=' + that.urlEncode(v);
  });
  return '?' + pairs.join('&');
};

UriContextHelper.prototype.pathJoin = function(){
	// put a fwd-slash between all pieces and remove any redundant slashes
	// additionally remove the trailing slash
  var pieces = _.flatten(_.toArray(arguments));
  var first = nodeUrl.parse(pieces[0]);
  var prefix = '';
  if (!!first.protocol){
    pieces[0] = first.path;
    prefix = first.protocol + '//' + first.host;
    var lastIndex = prefix.length - 1;
    if (prefix[lastIndex] == '/'){
      prefix = prefix.substring(0, lastIndex - 1);
    }
  }
  var joined = pieces.join('/').replace(/\/+/g, '/');
	joined = joined.replace(/\/$/, '');  // remove all trailing slashes
	joined = joined.replace(/^\/+/, ''); // remove all leading slashes
  joined = prefix + '/' + joined;
  return joined;
};

UriContextHelper.prototype.parent = function(inUrl){
  var url = inUrl || this._self;
  return this.absolute(this._router.getParentUrl(url));
};

UriContextHelper.prototype.child = function(inUrl){
  return this.absolute(this.pathJoin(this._self, inUrl));
};

UriContextHelper.prototype.pathEnd = function(inUrl){
  var path = nodeUrl.parse(inUrl || this._self).pathname;
  return _.last(path.split("/"));
};

UriContextHelper.prototype.parse = function(inUrl){
  return nodeUrl.parse(inUrl || this._self);

};

UriContextHelper.prototype.get = function(nameOrPath, varDict){
  if (!!nameOrPath){
    if (!!varDict){
      return this.absolute(this._router.getUrl(nameOrPath, varDict));
    }
    return this.absolute(this._router.getUrl(nameOrPath));
  }
  return this._self;
};

UriContextHelper.prototype.self = function(){
  return this.absolute(this._self);
};

UriContextHelper.prototype.param = function(key, defaultValue){
  var value = this.params()[key];
  if (!!value) { 
    return value; 
  }
  return defaultValue;
};

UriContextHelper.prototype.params = function(inUrl){
  if (!!inUrl){
    return this._router.pathVariables(inUrl);
  }
  if (!!this._params){
    return this._params;
  }
  return this._router.pathVariables(this._self);
};

module.exports = UriContextHelper;
