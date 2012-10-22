/*
 This context helper adds a json function to the
 context and callsback when done.

 The json function takes json object, and allows you to
manipulate it in various ways, and either send it as
a response ( .send() ), return it as a string 
( .toString() ), or return it as an object ( .toObject() ).

 */

var HyperJson = require('../HyperJson');
var HyperJsonCollection = require('../HyperJsonCollection');

var JsonContextHelper = function($, handler, cb){
  $.json = function(obj){
    var json = new HyperJson(obj);
    json.send = function(){send($, json);};
    return json;
  };
  $.jsonCollection = function(objArr){
    var json = new HyperJsonCollection(objArr);
    json.send = function(){send($, json);};
    return json;
  };
};


module.exports = JsonContextHelper;

function send($, json){
  addDefaultLinks($, json);
  $.res.setHeader('content-type', 'application/json');
  $.res.end(json.toString());
}

function addDefaultLinks($, json){
  var current = json.toObject();
  if (!current._links || !current._links.self){
    json.link('self', $.uri.self());
  }
  if (!current._links || !current._links.parent){
    try {
      var parent = $.uri.parent();
      json.link('parent', parent);
    } catch(ex){
      if (ex.message !== "NoParentUrl: The given path has no parent path"){
        throw ex;
      }
    }
  }
  return current;
}




