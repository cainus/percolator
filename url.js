var nodeUrl = require('url');
var querystring = require('querystring');
var _ = require('underscore');

var Url = function(router, urlstr, protocol, host){
  this._router = router;
  this._self = urlstr;
  this._params = null;
  this._protocol = protocol;
  this._host = host;
};


Url.prototype.absolute = function(path){
  if (path[0] == '/'){
    path = path.substring(1);
  }
  return this._protocol + "://" + this._host + '/' + path;
};

Url.prototype.urlEncode = function(str){
  return querystring.escape(str);
};

Url.prototype.urlDecode = function(str){
  return querystring.unescape(str);
};

Url.prototype.query = function(inUrl){
  var url = inUrl || this._self;
  var parsed = nodeUrl.parse(url);
  if (!!parsed.search){
    var qstr = parsed.search.substring(1);
    return querystring.parse(qstr);
  }
  return {};
};

Url.prototype.queryString = function(obj){
  var that = this;
  var pairs = _.map(obj, function(v, k){ 
    return that.urlEncode(k) + '=' + that.urlEncode(v);
  });
  return '?' + pairs.join('&');
};

Url.prototype.pathJoin = function(){
	// put a fwd-slash between all pieces and remove any redundant slashes
	// additionally remove the trailing slash
  var pieces = _.flatten(_.toArray(arguments));
  var joined = pieces.join('/').replace(/\/+/g, '/');
	joined = joined.replace(/\/$/, '');
  if ((joined.length === 0) || (joined[0] != '/')){ joined = '/' + joined; }
  return joined;
};

Url.prototype.links = function(){
  var links = this.namedKids();
  links.self = this._self;
  try {
    links.parent = this.parent();
  } catch (ex){
    if (ex.name != 'NoParentUrl'){
      throw ex;
    }
  }
  return links;
};

Url.prototype.parent = function(inUrl){
  var url = inUrl || this._self;
  return this._router.getParentUrl(url);
};

Url.prototype.namedKids = function(inUrl){
  var url = inUrl || this._self;
  return this._router.getNamedChildUrls(url);
};
Url.prototype.kids = function(inUrl){
  var url = inUrl || this._self;
  return this._router.getChildUrls(url);
};

Url.prototype.parse = function(inUrl){
  return nodeUrl.parse(this._self);

};

Url.prototype.get = function(nameOrPath, varDict){
  if (!!nameOrPath){
    if (!!varDict){
      return this._router.getUrl(nameOrPath, varDict);
    }
    return this._router.getUrl(nameOrPath);
  }
  return this._self;
};

Url.prototype.self = function(){
  return this._self;
};

Url.prototype.param = function(key, defaultValue){
  var value = this.params()[key];
  if (!!value) { 
    return value; 
  }
  return defaultValue;
};

Url.prototype.params = function(inUrl){
  if (!!inUrl){
    return this._router.pathVariables(inUrl);
  }
  if (!!this._params){
    return this._params;
  }
  return this._router.pathVariables(this._self);
};

Url.prototype.help = function(){
  console.log("HELP!");
  var retval = {};
  retval = _.extend(retval, {params : this.params()});
  retval = _.extend(retval, {links : this.links()});
  retval = _.extend(retval, {parse : this.parse()});
  retval = _.extend(retval, {query : this.query()});
  retval = _.extend(retval, {kids : this.kids()});
  retval = _.extend(retval, {namedKids : this.namedKids()});
  return retval;
};

exports.Url = Url;
