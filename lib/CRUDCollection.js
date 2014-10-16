var JSV = require('JSV').JSV;
var _ = require('underscore');

var CRUDCollection = function(options){

  if (!options || (!options.list && !options.collectionGET)){
    throw "the options parameter should have a list() or collectionGET() function.";
  }

  // TODO: list() array or object
  if (options.create && !options.createSchema && !!options.schema){
    options.createSchema = options.schema;
  }
  if (!options.updateSchema && !!options.schema){
    options.updateSchema = options.schema;
  }
  if (!options.update && !options.upsert){
    delete options.updateSchema; // if there's no update(), we ignore any updateSchema
  }

  var outputList = function (req, res, list, listOptions) {
    var key = (listOptions) ? listOptions.key : null;
    var objectKey = (key && listOptions.listAsKeyedObject) ? key : null;
    var collection = res.collection(list, objectKey);
    if (req.app.autoLink){
      collection = collection.linkEach('self', function(item, name){
        if (key){
          return req.uri.child(item[key].toString());  // allow 'listOptions' to provide another key to link on.
        } else {
          return req.uri.child(name);
        }
      });
    }
    if (!!options.createSchema && req.app.autoLink){
      collection = collection.link('create',
                                   req.uri.query(false),
                                   { method : 'POST',
                                     schema : options.createSchema});
    }
    collection.send();
  };

  this.handler = {
    GET : function(req, res){
      options.list(req, res, function(err, items, listOptions){
        if (!!err){
          return res.status.internalServerError(err);
        }
        outputList(req, res, items, listOptions);
      });
    }
  };

  if (!!options.create){
    this.handler.POST = function(req, res){
      req.onJson(options.createSchema, function(err, obj){
        options.create(req, res, obj, function(){
          return res.status.created(req.uri);
        });
      });
    };
  }

  this.wildcard = { };

  if (!!options.fetch){
    this.wildcard.fetch = options.fetch;
    this.wildcard.GET = function(req, res){
      var resource = res.object(req.fetched);
      if ((!!options.update || !!options.upsert) && (req.app.autoLink)){
        resource.link( "update", req.uri, {method : 'PUT', schema : options.updateSchema});
      }
      if (!!options.destroy && req.app.autoLink){
        resource.link( "delete", req.uri, {method : 'DELETE'});
      }
      resource.send();
    };
  }

  // UPDATE
  if (!!options.update){
    this.wildcard.fetchOnPUT = true;
    this.wildcard.PUT = function(req, res){
      req.onJson(options.updateSchema, function(err, obj){
        var id = req.uri.child();
        options.update(req, res, id, obj, function(){
          res.setHeader('Location', req.uri);
          res.writeHead(303);
          return res.end();
        });
      });
    };
  }

  // UPSERT
  if (!!options.upsert){
    // fetch is not used here, because this is for create as well as update
    this.wildcard.fetchOnPUT = false;

    this.wildcard.PUT = function(req, res){
      req.onJson(options.updateSchema, function(err, obj){
        var id = req.uri.child();
        options.upsert(req, res, id, obj, function(){
          res.setHeader('Location', req.uri);
          res.writeHead(303);
          return res.end();
        });
      });
    };
  }

  // DESTROY
  if (!!options.destroy){
    this.wildcard.DELETE = function(req, res){
      options.destroy(req, res, req.uri.child(), function(){
        res.writeHead(204);
        res.end();
      });
    };
  }

  if (!!options.collectionGET){
    this.handler.GET = options.collectionGET;
  }

  if (!!options.memberGET){
    this.wildcard.GET = options.memberGET;
  }

};
module.exports = CRUDCollection;
