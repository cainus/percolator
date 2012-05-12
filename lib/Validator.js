const _ = require('underscore')

var Validator = function(){
  this.validation = false
  this.fieldValidators = {}
}

Validator.prototype.setDocumentValidator = function(requiredFields, optionalFields, docValidationFunction){
  this.validation = {'required' : requiredFields,
                     'optional' : optionalFields,
                     'docValidator' : docValidationFunction}
}

Validator.prototype.addFieldValidator = function(fieldName, validator, message){
  this.fieldValidators[fieldName] = {"validator" : validator, "message" : message}
}

Validator.prototype.validate = function(doc, resourceName){
  if (!this.validation){return true;}
  var properties = _.keys(doc);

  var validatorResponses = []
  validatorResponses.push(this.checkRequiredAttributes(this.validation.required, properties, resourceName))
  validatorResponses.push(this.checkExtraAttributes(this.validation.optional, this.validation.required, properties, resourceName))
  validatorResponses.push(this.checkAttributeValidity(doc, resourceName))

  var error = false;
  _.any(validatorResponses, function(result){
    if (!!result.type){
      error = result; 
      return true;
    }
    return false;
  });
  if (error){return error;}
  if (this.validation.docValidator) {
    return this.validation.docValidator(doc);
  } else {
    return true;
  }
};

Validator.prototype.checkRequiredAttributes = function(requiredProperties, incomingProperties, resourceName){
  var missing = _.difference(requiredProperties, incomingProperties);
  if (missing.length > 0){
    var error = {
      "type": "MissingAttribute", 
      "message": "The " + resourceName + " resource requires a property named '" + missing[0] + "'",
      "detail": missing[0]
    }
    return error
  }
  return true
}

Validator.prototype.checkExtraAttributes = function(optionalProperties, requiredProperties, incomingProperties, resourceName){
  var allowedProperties = _.union(optionalProperties, requiredProperties);
  var extra = _.difference(incomingProperties, allowedProperties);
  if (extra.length > 0){
   var error = {
    "type": "UnexpectedAttribute", 
    "message": "The " + resourceName + " resource should not contain a property named '" + extra[0] + "'", 
    "detail": extra[0] 
    }
    return error
  }
  return true
}

Validator.prototype.checkAttributeValidity = function(doc, resourceName){
  var validator = this;
  try {
    _.each(doc, function(value, key){
      var validatorObj = validator.fieldValidators[key]
      if (!validatorObj) return false;
      if (validatorObj["validator"](value)){
        return false;
      } else {
        var error = {
          "type": "InvalidAttribute", 
          "message": "The " + resourceName + " resource requires a property named '" + key + "' that " + validatorObj["message"], 
          "detail": validatorObj["message"] 
        }
        throw error
      }
    });
  } catch (ex) {
    return ex
  }
  return true;
}

exports.Validator = Validator
