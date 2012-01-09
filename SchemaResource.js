const _ = require('./underscore-min');
const mongoose = require('mongoose');

SchemaResource = function(schemaClass, rootURL, resourceName){
  this.schemaClass = schemaClass;
  this.rootURL = rootURL;
  this.resourceName = resourceName;
}

SchemaResource.prototype.GET = function(req, res){
  var obj = this;
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    var item = docs[0];
    res.send(obj.toRepresentation(item.doc));
  });
}

SchemaResource.prototype.PUT = function(req, res){
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

SchemaResource.prototype.DELETE = function(req, res){
  this.schemaClass.find({_id: req.param('id')}).execFind(function(err, docs){
    if (!!err){console.log(err); throw err;}
    docs[0].remove(function(err){
      if (!!err){console.log(err); throw err;}
      res.send('', 200);
    });
  });
}
SchemaResource.prototype.collectionPOST = function(req, res){
  var obj = this;
  var item = new this.schemaClass();
  var body = JSON.parse(req.fullBody);
  item.name = body.name;
  item.save(function (err) {
    if (!!err){console.log(err); throw err;}
    res.send(obj.toRepresentation(item.doc));
  });
}

SchemaResource.prototype.collectionGET = function(req, res){
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

SchemaResource.prototype.toRepresentation = function(item){
  var url = this.rootURL + '/' + this.resourceName
  item.links = { self: { href: url + "/" + item._id },
                 parent: { href: url }
               };
  return(item)
};

exports.SchemaResource = SchemaResource;