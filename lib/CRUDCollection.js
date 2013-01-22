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

  var outputList = function($, list, collectionOptions){
    var collection = $.jsonCollection(list);
    if ($.app.autoLink){
      collection = collection.linkEach('self', function(item, name){
        if (!!collectionOptions && collectionOptions.id){
          return $.uri.child(item[collectionOptions.id]);  // allow 'options' to provide another key to link on.
        } else {
          return $.uri.child(name);
        }
      });
    }
    if (!!options.createSchema && $.app.autoLink){
      collection = collection.link('create',
                                   $.uri.queryClear(),
                                   { method : 'POST',
                                     schema : options.createSchema});
    }
    collection.send();
  };

  this.handler = {
    GET : function($){
      options.list($, function(err, items, options){
        if (!!err){
          return $.status.internalServerError(err);
        }
        outputList($, items, options);
      });
    }
  };

  if (!!options.create){
    this.handler.POST = function($){
      $.onJson(options.createSchema, function(err, obj){
        options.create($, obj, function(){
          return $.status.created($.uri.self());
        });
      });
    };
  }

  this.wildcard = { };

  if (!!options.fetch){
    this.wildcard.fetch = options.fetch;
    this.wildcard.GET = function($){
      var resource = $.json($.fetched);
      if ((!!options.update || !!options.upsert) && ($.app.autoLink)){
        resource.link( "update", $.uri.self(), {method : 'PUT', schema : options.updateSchema});
      }
      if (!!options.destroy && $.app.autoLink){
        resource.link( "delete", $.uri.self(), {method : 'DELETE'});
      }
      resource.send();
    };
  }

  // UPDATE
  if (!!options.update){
    this.wildcard.fetchOnPUT = true;
    this.wildcard.PUT = function($){
      $.onJson(options.updateSchema, function(err, obj){
        var id = $.uri.pathEnd();
        options.update($, id, obj, function(){
          $.res.setHeader('Location', $.uri.self());
          $.res.writeHead(303);
          return $.res.end();
        });
      });
    };
  }

  // UPSERT
  if (!!options.upsert){
    // fetch is not used here, because this is for create as well as update
    this.wildcard.fetchOnPUT = false;

    this.wildcard.PUT = function($){
      $.onJson(options.updateSchema, function(err, obj){
        var id = $.uri.pathEnd();
        options.upsert($, id, obj, function(){
          $.res.setHeader('Location', $.uri.self());
          $.res.writeHead(303);
          return $.res.end();
        });
      });
    };
  }

  // DESTROY
  if (!!options.destroy){
    this.wildcard.DELETE = function($){
      options.destroy($, $.uri.pathEnd(), function(){
        $.res.writeHead(204);
        $.res.end();
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
