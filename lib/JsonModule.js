var JSV = require('JSV').JSV;

var JsonModule = function(options){

  if (!options || !options.list){
    throw "JsonModule needs an options array with a 'list' function.";
  }

  // TODO: createViaPUT
  // TODO: list() array or object
  if (options.create && !options.createSchema && !!options.schema){
    options.createSchema = options.schema;
  }
  if (!options.updateSchema && !!options.schema){
    options.updateSchema = options.schema;
  }

  var outputList = function($, list){
    var collection = $.jsonCollection(list)
      .linkEach('self', function(item, name){
        return $.uri.child(name);
      });
    if (!!options.createSchema){
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
      $.onBody(function(err, body){
        var obj;
        try {
          obj = JSON.parse(body);
        } catch(ex) {
          // if it's not valid JSON...
          return $.status.badRequest('invalid json.', body);
        }
        var report = JSV.createEnvironment().validate(obj, options.createSchema);
        if (report.errors.length > 0){
          return $.status.badRequest('json failed schema validation.', report.errors);
        }
        options.create($, obj);
      });
    };
  }

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
