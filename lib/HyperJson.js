var _ = require('underscore');

HyperJson = function(obj){
  this.obj = _.clone(obj);
};

HyperJson.prototype.toString = function(){
  return JSON.stringify(this.obj);
};

HyperJson.prototype.toObject = function(){
  return this.obj;
};

HyperJson.prototype.property =function(name, value){
  this.obj[name] = value;
  return this;
};

HyperJson.prototype.link = function(rel, href, opts){
  var options = opts || {};
  var linkObj = { href : href};
  for (var name in options){
    if (name != 'method' && name != 'type' && name != 'schema'){
      throw "unknown option: " + name;
    }
    linkObj[name] = options[name];
  }
  if (!this.obj._links){
    this.obj._links = {};
  }
  if (!this.obj._links[rel]){
    this.obj._links[rel] = linkObj;
  } else {
    var relObj = this.obj._links[rel];
    if (!Array.isArray(relObj)){
      this.obj._links[rel] = [relObj];
    }
    this.obj._links[rel].push(linkObj);
  }
  return this;
};

module.exports = HyperJson;

