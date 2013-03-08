/*
 This helper adds a object function to the
 object and callsback when done.

 The json function takes json object, and allows you to
manipulate it in various ways, and either send it as
a response ( .send() ), return it as a string 
( .toString() ), or return it as an object ( .toObject() ).

 */

var HyperJson = require('../HyperJson');
var HyperJsonCollection = require('../HyperJsonCollection');

var ObjectHelper = function(req, res, handler, cb){
  res.object = function(obj){
    var json = new HyperJson(obj);
    json.send = function(){send(req, res, json);};
    return json;
  };
  res.collection = function(objArr, key){
    var json = new HyperJsonCollection(objArr, key);
    json.send = function(){send(req, res, json);};
    return json;
  };
  if (cb){
    cb();
  }
};


module.exports = ObjectHelper;

function send(req, res, json){
  if (req.app.autoLink){
    addDefaultLinks(req, res, json);
  }
  res.setHeader('content-type', 'application/json');
  res.end(json.toString());
}

function addDefaultLinks(req, res, json){
  var current = json.toObject();
  if (!current._links || !current._links.parent){
    try {
      var parent = req.uri.parent();
      json.link('parent', parent);
    } catch(ex){
      if (ex.message !== "The given path has no parent path"){
        throw ex;
      }
    }
  }
  return current;
}




