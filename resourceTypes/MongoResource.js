const _ = require('underscore');
const mongoose = require('mongoose');


var MongoResource = function(app, resourceName, schema){
  this.schemaClass = mongoose.model(resourceName, new mongoose.Schema(schema));
  var rootURL = "http://localhost:3000"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
}

MongoResource.prototype.GET = function(req, res){
  var obj = this;
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    var item = docs[0];
    res.send(obj.toRepresentation(item.doc));
  });
}

MongoResource.prototype.PUT = function(req, res){
  var obj = this;
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    var item = docs[0]
    var body = JSON.parse(req.fullBody);
    item.name = body.name
    item.save(function(err){
      if (!!err){console.log(err); throw err;}
      res.send(obj.toRepresentation(item.doc));
    });
  });
}

MongoResource.prototype.DELETE = function(req, res){
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    docs[0].remove(function(err){
      if (!!err){console.log(err); throw err;}
      res.send('', 200);
    });
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
  try {
    var body = JSON.parse(req.fullBody);
  } catch(err){
    res.send('MalformedJSON [' + req.fullBody + ']', 400);
    return;
  }
  console.log('in coll post');
  var doc_data = {
    "name" : body.name
  }
  var item = new this.schemaClass(doc_data);
  console.log('schema', this.schemaClass)
  console.log("item", item);
  item.save(function (err) {
    if (!!err){
      switch(err.name){
        case 'ValidationError':
          res.send(JSON.stringify(err), 422);
          break;
        default : 
          console.log(err);
          throw err;
      }
      return
    } else {
      res.header('Location',  obj.rootURL + '/' + obj.resourceName + '/' + item._id);
      res.send(201);
    }
  });
}

MongoResource.prototype.collectionGET = function(req, res){
  var obj = this;
  this.schemaClass.find({}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    var items = _.map(docs, function(v, k){
      return(obj.toRepresentation(v.doc));
    });

    var itemCollection = { items: items,
                           links: {
                             self: { href: obj.rootURL + '/' + obj.resourceName },
                             parent: { href: obj.rootURL }
                          }};
    res.send(itemCollection);
  });
  console.log("after");
}

MongoResource.prototype.toRepresentation = function(item){
  var url = this.rootURL + '/' + this.resourceName
  item.links = { self: { href: url + "/" + item._id },
                 parent: { href: url }
               };
  return(item)
};

exports.MongoResource = MongoResource;
