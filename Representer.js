const _ = require('underscore');

var Representer = function(){};

Representer.prototype.error = function(type, message, detail){
	if (!type || !message) {
		throw "MissingRequiredFields"
	}
  var jsonError = { 'error' : { 'type' : type, 'message' : message} }
  if (detail == "" || !!detail){
     jsonError["error"]["detail"] = detail
  }
  return JSON.stringify(jsonError);
};

Representer.prototype.options = function(methods){
	return JSON.stringify({"Allowed" : methods})
};

Representer.prototype.individual = function(object, links){
	if (!_.include(_.keys(links), "self")){ throw "MissingSelfLink"}

	object.links = links
	return JSON.stringify(object)
};

Representer.prototype.collection = function(collectionName, objects, collectionLinks, maxPageSize, pageLinks){
	var collection = {}
	collection[collectionName] = objects
	
	if (!_.include(_.keys(collectionLinks), "self")){ throw "MissingSelfLink"}
	collection.links = collectionLinks

	if (maxPageSize && pageLinks){
		if (!_.include(_.keys(pageLinks), "first")){ throw "MissingFirstPageLink"}
		collection.pagination = { "maxPageSize": maxPageSize, "links": pageLinks }
	}
	return JSON.stringify(collection)
}
exports.Representer = Representer;