const _ = require('underscore');
const mongoose = require('mongoose');
const Resource = require('./Resource').Resource;

var MongoResource = function(app, resourceName, schema){
  this.schemaClass = mongoose.model(resourceName, new mongoose.Schema(schema));
  var rootURL = "/"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
}

MongoResource.prototype = new Resource({}, 'resourceName');

MongoResource.prototype.GET = function(req, res){
  var obj = this;
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){
      console.log("unknown error:");
      console.log(err); 
      throw err;
    }
    if (docs.length == 0){
      var errDoc = obj.error('RecordNotFoundError', 'A record with the given id could not be found.', req.param('id'));
      console.log(errDoc);
      res.send(errDoc, 404);
    } else {
      var item = docs[0];
      res.send(obj.toRepresentation(item.doc, obj.getParentURI(req)));
    }
  });
}

MongoResource.prototype.PUT = function(req, res){
  var obj = this;
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    var item = docs[0]
    var body = JSON.parse(req.fullBody);
    item.name = body.name
    if (!!body._artist){
      item._artist = body._artist
    };
    item.save(function(err){
      if (!!err){console.log(err); throw err;}
      res.send(obj.toRepresentation(item.doc, obj.getParentURI(req)));
    });
  });
}

MongoResource.prototype.DELETE = function(req, res){
  var obj = this;
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){
      console.log("unknown error:");
      console.log(err); 
      throw err;
    }
    if (docs.length == 0){
      console.log("unfound!");
      var errDoc = obj.error('RecordNotFoundError', 'A record with the given id could not be found.', req.param('id'));
      res.send(errDoc, 404);
    } else {
      docs[0].remove(function(err){
        if (!!err){console.log(err); throw err;}
        res.send('', 200);
      });
    }
  });
}

MongoResource.prototype.collectionPOST = function(req, res){
  var obj = this;
  var json_type = 'application/json';
  var contentType = req.header('Content-Type');
  var error = false;
  if (!contentType || contentType.substring(0, json_type.length) != json_type){
    res.send('IncorrectContentType', 415);
    return
  }
  var body = req.jsonBody;
  console.log("=================BODY============================");
  console.log(body);
  var mongoRes = this;
  this.preCreate(req, res, function(err, doc){
    console.log("doc is: " + doc);
    if (!err){
      var item = new mongoRes.schemaClass(doc);
      console.log('schema', mongoRes.schemaClass)
      console.log("item", item);
      if (!!err){
        console.log("ERR");
        console.log(err);
      }
      item.save(function (err) {
        if (!!err){
          console.log("save error: " + err);
          if (err.toString().indexOf("duplicate key error index") != -1){
           // example: [Error: E11000 duplicate key error index: slackertax.users.$login_1  dup key: { : null }]
           var re = new RegExp('\.\$([a-zA-Z]+)_[0-9]');
           re = new RegExp('\\.\\$([a-zA-Z]+)_[0-9]');
           var match = err.toString().match(re);
           console.log(err.toString());
           console.log(match);
           if (match){
             var detail = match[1];
           } else {
             var detail = err.toString();
           }
           var errDoc = mongoRes.error('DuplicateKeyError', 
                                       'Inserting that resource would violate a uniqueness constraint.', 
                                       detail);
           console.log("ERRDOC");
           console.log(errDoc);
           console.log("pre 409")
           res.send(errDoc, 409);
           console.log("post 409")
           return;
          }

          console.log("============================================");
          console.log(err);
          switch(err.name){
            case 'ValidationError':
              res.send(JSON.stringify(err), 422);
              break;
            default : 
              console.log(err);
              res.send(JSON.stringify(err), 500);
          }
          return
        } else {

          mongoRes.postCreate(req, res, function(err){
            res.header('Location',  mongoRes.href(item._id));
            res.send('', 201);
          });
        }
      });
    }
  });
}


MongoResource.prototype.finder = function(req){
  return this.schemaClass.find({});
}

MongoResource.prototype.collectionGET = function(req, res){
  var obj = this;
  this.finder(req).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    var items = _.map(docs, function(v, k){
      return(obj.toRepresentation(v.doc, obj.getParentURI(req)));
    });

    var url = req.app.settings.base_path

    var itemCollection = { items: items,
                           links: {
                             self: { href: url + '/' + obj.resourceName },
                             parent: { href: url }
                          }};
    res.send(itemCollection);
  });
}

exports.MongoResource = MongoResource;
