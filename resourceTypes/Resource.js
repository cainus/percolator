const _ = require('underscore');


var Resource = function(app, resourceName){
  var rootURL = "/"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
  this.validation = false;
  this.field_validators = {}
}

Resource.prototype.setDocumentValidator = function(requiredFields, optionalFields,doc_validation_function){
  this.validation = {'required' : requiredFields,
                     'optional' : optionalFields,
                     'docValidator' : doc_validation_function}
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

Resource.prototype.send_error = function(res, status_code, type, message, detail){
  var retval = { 'error' : { 'type' : type, 'message' : message} }
  if (detail == "" || !!detail){
     retval["error"]["detail"] = detail
  }
  res.send( retval, status_code )
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
      links[new_key] = { href: url + new_key + 's' + '/' + v };
      delete item[k]
    };
  });
  item.links = links;
  return(item)
};

Resource.prototype.add_field_validator = function(field_name, validator, message){
  this.field_validators[field_name] = {"validator" : validator, "message" : message}
}

Resource.prototype.validate = function(response, doc){
  var resource = this;
  if (!this.validation){return true;}
  var properties = _.keys(doc);
  var missing = _.difference(this.validation.required, properties);
  console.log("missing?");
  if (missing.length > 0){
   console.log('missing required');
   console.log(missing);
   this.send_error(response, 422,
                        "MissingAttribute",
                        "The " + resource.resourceName + " resource requires a property named '" + missing[0] + "'", missing[0]);
   console.log("missing? yes.");
   return false;
  }

  console.log("missing? no.");
  var allowed = _.union(this.validation.optional, this.validation.required);
  var extra = _.difference(properties, allowed);
  console.log("extra?");
  if (extra.length > 0){
   console.log('extra? yes');
   this.send_error(response, 422,
                        "UnexpectedAttribute",
                        "The " + resource.resourceName + " resource should not contain a property named '" + extra[0]+ "'", extra[0]);
   return false;
  }
  console.log('extra? no');
  console.log('bad field?');
  var bad_field = _.any(doc, function(value, key){
    var validator_obj = resource.field_validators[key]
    if (!validator_obj) return false;
    if (validator_obj["validator"](value)){
      return false;
    } else {
      console.log('bad property: ', value);
      console.log("doc: ", doc);
      resource.send_error(response, 422,
                        "InvalidAttribute",
                        "The " + resource.resourceName + 
                          " resource requires a property named '" + 
                          key + "' that " + validator_obj["message"], key);
      return true;
    }
  });
  if (bad_field) {
    console.log('bad field? yes.');
    return false;
  }
  console.log('bad field? no.');
  if (this.validation.docValidator) {
    return this.validation.docValidator(response, doc);
  } else {
    return true;
  }
};

Resource.prototype.preCreate = function(req, res, cb){
  var doc = req.jsonBody;
  if (this.validate(res, doc)){
    return cb(false);
  }
  return cb(true);
}
Resource.prototype.postCreate = function(req, res, cb){
  return cb(false);
}

exports.Resource = Resource;
