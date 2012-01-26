const _ = require('underscore');
const mongoose = require('mongoose');


var MongoResource = function(app, resourceName, schema){
  this.schemaClass = mongoose.model(resourceName, new mongoose.Schema(schema));
  var rootURL = "/"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
}

MongoResource.prototype.getParentURI = function(req){
  var path = req.originalUrl.split(this.resourceName)[0];
  var parentURI = req.app.settings.base_path + path
  console.log("parentUri: " + parentURI);
  return parentURI;
}

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
  console.log("HERE!!")
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

MongoResource.prototype.preCreate = function(req, res, cb){
  cb(false);
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
  try {
    var body = JSON.parse(req.fullBody);
  } catch(err){
    res.send('MalformedJSON [' + req.fullBody + ']', 400);
    return;
  }
  console.log('in coll post');
  var mongoRes = this;
  this.preCreate(req, res, function(err, doc){
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
          if (err.toString().indexOf("duplciate key error index")){
           // example: [Error: E11000 duplicate key error index: slackertax.users.$login_1  dup key: { : null }]
           var errDoc = mongoRes.error('DuplicateKeyError', 'Inserting that resource would violate a uniqueness constraint.', err.toString());
           console.log("ERRDOC");
           console.log(errDoc);
           res.send(errDoc, 409);
           return;
          }

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
          res.header('Location',  mongoRes.href(item._id));
          res.send(201);
        }
      });
    }
  });
}

MongoResource.prototype.collectionGET = function(req, res){
  var obj = this;
  this.schemaClass.find({}).execFind(function(err, docs){
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
  console.log("after");
}

MongoResource.prototype.href = function(id, base_path){
  var url = '';
  if (base_path){ url = base_path; }
  if (url[url.length - 1] != '/'){
    url += '/';
  }
  url += (this.resourceName + "/" + id)
  return url
}

MongoResource.prototype.error = function(type, message, detail){
  var retval = { 'error' : { 'type' : type, 'message' : message} }
  if (!!detail){
     retval["error"]["detail"] = detail
  }
  return retval 
}

MongoResource.prototype.toRepresentation = function(item, base_path){
  var url = base_path || ''
  if (url[url.length - 1] != '/'){
    url += '/';
  }
  var links = { self: { href: this.href(item._id, url) },
                 parent: { href: url + this.resourceName }
               };
  _.each(item, function(v, k){
    if (k[0] === '_' && k !== '_id'){
      new_key = k.slice(1);
      links[new_key] = { href: url + new_key + 's' + '/' + v };
      delete item[k]
    };
  });
  item.links = links;
  return(item)
};

exports.MongoResource = MongoResource;