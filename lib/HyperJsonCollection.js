var _ = require('underscore');
var HyperJson = require('./HyperJson');

HyperJsonCollection = function(obj){
  this.obj = { _items : _.clone(obj)};
};

HyperJsonCollection.prototype = Object.create(HyperJson.prototype);

HyperJsonCollection.prototype.each = function(cb){
  var items = this.obj._items;
  if (Array.isArray(items)){
    var len = (!!items) ? items.length : 0;
    for(var i = 0; i < len; i++){
      items[i] = cb(items[i]);
    }
  } else {
    for(var x in items){
      items[x] = cb(_.clone(items[x]), x);
    }
  }
  return this;
};

HyperJsonCollection.prototype.linkEach = function(rel, cb){
  var items = this.obj._items;
  if (Array.isArray(items)){
    var len = (!!items) ? items.length : 0;
    for(var i = 0; i < len; i++){
      items[i] = new HyperJson(_.clone(items[i])).link(rel, cb(items[i], i)).toObject();
    }
  } else {
    for(var x in items){
      items[x] = new HyperJson(_.clone(items[x])).link(rel, cb(items[x], x)).toObject();
    }
  }
  return this;
};

module.exports = HyperJsonCollection;

