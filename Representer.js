const _ = require('underscore');

var Representer = function(){};

Representer.prototype.error = function(type, message, detail){
	if (!type || !message) {
		throw new Error("MissingRequiredFields");
	}
  var jsonError = { 'error' : { 'type' : type, 'message' : message} }
  if (detail == "" || !!detail){
     jsonError["error"]["detail"] = detail
  }
  return jsonError;
};

exports.Representer = Representer;