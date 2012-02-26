const _ = require('underscore');

var Builder = function(){};

Builder.prototype.error = function(type, message, detail, callback){
	if (!type || !message) {
		callback("MissingRequiredFields")
		return
	}
  var jsonError = { 'error' : { 'type' : type, 'message' : message} }
  if (detail == "" || !!detail){
     jsonError["error"]["detail"] = detail
  }
  callback(null, jsonError)
};

exports.Builder = Builder;