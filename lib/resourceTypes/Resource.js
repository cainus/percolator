const _ = require('underscore');
const Validator = require('../Validator').Validator

var Resource = function(app, resourceName){
  var rootURL = "/"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
  this.validator = new Validator();
}

Resource.prototype.getParentURI = function(req){
  var path = req.originalUrl.split(this.resourceName)[0];
  var parentURI = req.app.settings.base_path + path
  console.log("parentUri: " + parentURI);
  return parentURI;
}

Resource.prototype.href = function(id, base_path){
  var url = '';
  if (base_path){ url = base_path; }
  if (url[url.length - 1] != '/'){
    url += '/';
  }
  url += (this.resourceName + "/" + id)
  return url
}

Resource.prototype.toRepresentation = function(item, base_path){
  var url = base_path || ''
  if (url[url.length - 1] != '/'){
    url += '/';
  }
  var links = { self: { href: this.href(item._id, url) },
                 parent: { href: url + this.resourceName }
               };
  _.each(item, function(v, k){
    if (k[0] === '_' && k !== '_id'){
      new_key = k.slice(1);
      links[new_key] = { href: url + new_key + '/' + v };
      delete item[k]
    };
  });
  item.links = links;
  return(item)
};

Resource.prototype.preCreate = function(req, res, cb){
  var doc = req.jsonBody;
  var vRes = this.validator.validate(doc, this.resourceName)
  if (vRes.type){
    res.error.send(422, vRes.type, vRes.message, vRes.detail);
    return cb(true, doc);
  }
  return cb(false, doc);
}
Resource.prototype.postCreate = function(req, res, cb){
  return cb(false);
}

exports.Resource = Resource;
