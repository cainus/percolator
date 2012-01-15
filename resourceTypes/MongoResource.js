const _ = require('underscore');
const mongoose = require('mongoose');

var MongoResource = function(app, resourceName, schema){

  var schemaObj= new mongoose.Schema(schema);
  this.schemaClass = mongoose.model(resourceName, schemaObj);
  var rootURL = "http://localhost:3000"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
}

MongoResource.prototype.GET = function(req, res){
  console.log(req)
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
    if (!!body._artist){
      item._artist = body._artist
    };
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
  var item = new this.schemaClass();
  var body = JSON.parse(req.fullBody);
  item.name = body.name;
  item.save(function (err) {
    if (!!err){console.log(err); throw err;}
    res.send(obj.toRepresentation(item.doc));
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
}

MongoResource.prototype.toRepresentation = function(item){
  var rootURL = this.rootURL
  _.each(item, function(v, k){
    if (k[0] === '_' && k !== '_id'){
      new_key = k.slice(1);
      item[new_key] = { href: rootURL + '/' + new_key + 's' + '/' + v };
      delete item[k]
    };
  });
  var url = rootURL + '/' + this.resourceName
  item.links = { self: { href: url + "/" + item._id },
                 parent: { href: url }
               };
  return(item)
};

exports.MongoResource = MongoResource;