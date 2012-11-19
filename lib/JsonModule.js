var JSV = require('JSV').JSV;
var _ = require('underscore');

var JsonModule = function(options){

  if (!options || !options.list){
    throw "JsonModule needs an options array with a 'list' function.";
  }

  if (!!options.upsert && (!!options.create || !!options.update)){
    throw "JsonModule should not have create() or update() if it has upsert().";
  }

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
        options.create($, obj, function(){
          return $.status.created($.uri.self());
        });
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

  if (!!options.update){
    this.wildcard.PUT = function($){
      $.onBody(function(err, body){
        var obj;
        try {
          obj = JSON.parse(body);
        } catch(ex) {
          // if it's not valid JSON...
          return $.status.badRequest('invalid json.', body);
        }
        var report = JSV.createEnvironment().validate(obj, options.updateSchema);
        if (report.errors.length > 0){
          return $.status.badRequest('json failed schema validation.', report.errors);
        }
        var id = getId($);
        options.update($, id, obj, function(){
          $.res.setHeader('Location', $.uri.self());
          $.res.writeHead(303);
          return $.res.end();
        });
      });
    };
  }

  if (!!options.upsert){
    //TODO: this needs to not care about 404s
    this.wildcard.PUT = function($){
      $.onBody(function(err, body){
        var obj;
        try {
          obj = JSON.parse(body);
        } catch(ex) {
          // if it's not valid JSON...
          return $.status.badRequest('invalid json.', body);
        }
        var report = JSV.createEnvironment().validate(obj, options.updateSchema);
        if (report.errors.length > 0){
          return $.status.badRequest('json failed schema validation.', report.errors);
        }
        var id = getId($);
        options.upsert($, id, obj, function(){
          $.res.setHeader('Location', $.uri.self());
          $.res.writeHead(303);
          return $.res.end();
        });
      });
    };
  }

  if (!!options.destroy){
    this.wildcard.DELETE = function($){
      var id = getId($);
      options.destroy($, id, function(){
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

  if (options.fetch){
    this.wildcard.fetch = options.fetch;
  }

};
module.exports = JsonModule;

// TODO: shouldn't this go on $.uri ?
function getId($){
  return _.last($.uri.self().split("/"));
}


// TODO extract json schema validation to a context helper.
// TODO extra json parsing to a $.onJSON() context helper.
//
