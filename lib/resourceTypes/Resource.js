const _ = require('underscore');
const Validator = require('../Validator').Validator

var Resource = function(app, resourceName){
  var rootURL = "/"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
  this.validator = new Validator();
}

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
