var JsonModule = function(options){

  if (!options || !options.list){
    throw "JsonModule needs an options array with a 'list' function.";
  }

  // TODO: createViaPUT
  // TODO: list() array or object
  if (!options.createSchema && !!options.schema){
    options.createSchema = options.schema;
  }
  if (!options.updateSchema && !!options.schema){
    options.updateSchema = options.schema;
  }

  var outputList = function($, list){
    var collection = $.jsonCollection($.app.artists)
      .linkEach('self', function(item, name){
        return $.uri.child(name);
      });
    if (!!options.createSchema){
      collection = collection.link('create', $.uri.self(), {method : 'POST', schema : options.createSchema});
    }
    collection.send();
  };

  this.handler = {
    POST : function($){
      $.res.end();
    },
    GET : function($){
      options.list($, function(err, items){
        outputList($, items);
      });
    }
  };

  this.wildcard = {

    GET : function($){
      var resource = $.json($.fetched);
      if (!!options.updateSchema){
        resource.link( "update", $.uri.self(), {method : 'PUT', schema : options.updateSchema});
      }
      resource.send();
    }

  };

  if (!!options.collectionGET){
    this.handler.GET = options.collectionGET;
  }

  if (!!options.memberGET){
    this.wildcard.GET = options.memberGET;
  }

  if (options.fetch){
    this.wildcard.fetch = options.fetch;
  }

};
module.exports = JsonModule;
