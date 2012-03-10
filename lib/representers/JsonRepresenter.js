const _ = require('underscore');

var JsonRepresenter = function(){};

JsonRepresenter.prototype.contentType = 'application/json'

JsonRepresenter.prototype.parse = function(str){
  return JSON.parse(str)
}

JsonRepresenter.prototype.documentMiddleWare = function(req, res, next){
    try {
      req.doc = this.parse(req.fullBody);
    } catch(err){
      var errorMessage = 'The body of your request was not a well-formed ' + this.contentType + ' document.'
      var errDoc = res.error.send(400, 'MalformedDocument', errorMessage , req.fullBody + "");
      return;
    }
}


JsonRepresenter.prototype.error = function(type, message, detail){
	if (!type || !message) {
		throw "MissingRequiredFields"
	}
  var jsonError = { 'error' : { 'type' : type, 'message' : message} }
  if (detail == "" || !!detail){
     jsonError["error"]["detail"] = detail
  }
  return JSON.stringify(jsonError);
};

JsonRepresenter.prototype.options = function(methods){
	return JSON.stringify({"Allowed" : methods})
};

JsonRepresenter.prototype.individual = function(object, links){
	if (!_.include(_.keys(links), "self")){ throw "MissingSelfLink"}
	object.links = links
	return JSON.stringify(object)
};

JsonRepresenter.prototype.collection = function(collectionName, objects, collectionLinks, maxPageSize, pageLinks){
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

JsonRepresenter.prototype.serviceDocument = function(path, root_resources){
  var links = {'self' : path}
  _.each(root_resources, function(resource){
    links[resource] = urlJoin(path, resource);
  });
  var serviceDoc = this.individual({}, links)
  return {
    'GET' : function(req, res){ res.send(serviceDoc); }
  }
}

function urlJoin(){
  var joined =_.toArray(arguments).join('/').replace(/\/+/g, '/')  // put a fwd-slash between all pieces and remove any redundant slashes
  return joined;
}
exports.JsonRepresenter = JsonRepresenter;
