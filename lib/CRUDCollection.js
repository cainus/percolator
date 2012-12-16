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

  var outputList = function($, list){
    var collection = $.jsonCollection(list);
    if ($.app.autoLink){
      collection = collection.linkEach('self', function(item, name){
          return $.uri.child(name);
      });
    }
    if (!!options.createSchema && $.app.autoLink){
      collection = collection.link('create',
                                   $.uri.self(),
                                   { method : 'POST',
                                     schema : options.createSchema});
    }
    collection.send();
  };

  this.handler = {
    GET : function($){
      options.list($, function(err, items){
        outputList($, items);
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
    this.wildcard.GET = setFetchedOnMethod(options, function($){
      var resource = $.json($.fetched);
      if ((!!options.update || !!options.upsert) && ($.app.autoLink)){
        resource.link( "update", $.uri.self(), {method : 'PUT', schema : options.updateSchema});
      }
      if (!!options.destroy && $.app.autoLink){
        resource.link( "delete", $.uri.self(), {method : 'DELETE'});
      }
      resource.send();
    });
  }

  // UPDATE
  if (!!options.update){
    this.wildcard.PUT = setFetchedOnMethod(options, function($){
      $.onJson(options.updateSchema, function(err, obj){
        var id = $.uri.pathEnd();
        options.update($, id, obj, function(){
          $.res.setHeader('Location', $.uri.self());
          $.res.writeHead(303);
          return $.res.end();
        });
      });
    });
  }

  // UPSERT
  if (!!options.upsert){
    // fetch is not used here, because this is for create as well as update
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
    this.wildcard.DELETE = setFetchedOnMethod(options, function($){
      options.destroy($, $.uri.pathEnd(), function(){
        $.res.writeHead(204);
        $.res.end();
      });
    });
  }

  if (!!options.collectionGET){
    this.handler.GET = setFetchedOnMethod(options, options.collectionGET);
  }

  if (!!options.memberGET){
    this.wildcard.GET = setFetchedOnMethod(options, options.memberGET);
  }

};
module.exports = CRUDCollection;


// this takes a method handler like wildcard.GET and wraps it with another function
// that sets $fetched first before calling it.
function setFetchedOnMethod(options, fn){
  if (!options.fetch){
    return fn;
  }
  return function($){
    var id = $.uri.pathEnd();
    options.fetch($, id, function(err, fetched){
      if (err === true){
        // if it returns an error, throw a 404
        return $.status.notFound($.req.url);
      }
      if (!!err){
        return $.status.internalServerError(err);
      }
      $.fetched = fetched;
      fn($);
    });
  };
}


