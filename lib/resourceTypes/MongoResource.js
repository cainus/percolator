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
  var id = req.param('id');
  this.schemaClass.find({_id: id}).execFind(function(err, docs){
    if (!!err){
      console.log("unknown error:");
      console.log(err); 
      res.error.send(500, 'UnknownError', 'An unknown error occurred.', err);
    }
    if (docs.length == 0){
      res.error.send(404, 'RecordNotFoundError', 'A record with the given id could not be found.', id);
    } else {
      var item = docs[0];
      res.show(item.doc)
    }
  });
}

MongoResource.prototype.PUT = function(req, res){
  var obj = this;
  var id = req.param('id')
  this.schemaClass.find({_id: id}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    if (docs.length == 0){
      res.error.send(404, 'RecordNotFoundError', 'A record with the given id could not be found.', id);
      return
    }
    var item = docs[0]
    var body = JSON.parse(req.fullBody);
    item.name = body.name
    if (!!body._artist){
      item._artist = body._artist  //TODO WTF?
    };
    item.save(function(err){
      if (!!err){console.log(err); throw err;}
      res.show(item.doc);
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
      res.error.send(404, 'RecordNotFoundError', 'A record with the given id could not be found.', req.param('id'));
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
  // TODO should not be checking content-type here!
  if (!contentType || contentType.substring(0, json_type.length) != json_type){
    res.send('IncorrectContentType', 415);
    return
  }
  var body = req.jsonBody;
  //console.log("=================BODY============================");
  //console.log(body);
  var mongoRes = this;
  this.preCreate(req, res, function(err, doc){
    //console.log("doc is: " + doc);
    if (!err){
      var item = new mongoRes.schemaClass(doc);
      //console.log('schema', mongoRes.schemaClass)
      //console.log("item", item);
      if (!!err){
        console.log("ERR", err);
      }
      item.save(function (err) {
        if (!!err){
          //console.log("save error: " + err);
          if (err.toString().indexOf("duplicate key error index") != -1){
           // example: [Error: E11000 duplicate key error index: slackertax.users.$login_1  dup key: { : null }]
           var re = new RegExp('\.\$([a-zA-Z]+)_[0-9]');
           re = new RegExp('\\.\\$([a-zA-Z]+)_[0-9]');
           var match = err.toString().match(re);
           if (match){
             var detail = match[1];
           } else {
             var detail = err.toString();
           }
           res.error.send(409, 
                          'DuplicateKeyError',
                          'Inserting that resource would violate a uniqueness constraint.',
                          detail);
           return;
          }

          switch(err.name){
            case 'ValidationError':
              res.error.send(422, "ValidationError", err.message, err.errors)
              break;
            default : 
              res.error.send(500, "UnknownError", 'An unknown error occurred', err)
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
      // TODO - muuurrrrrrder!!!
      return(obj.toRepresentation(v.doc, obj.getParentURI(req)));
      //return(obj.toRepresentation(v.doc, req.originalUrl));
    });
    res.show(items)
  });
}

exports.MongoResource = MongoResource;
