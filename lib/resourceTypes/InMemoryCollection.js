const _ = require('underscore');
var FI_resourceful = require('resourceful');
const Resource = require('./Resource').Resource;
var revalidator = require('revalidator');

var InMemoryCollection = function(resourceName, flatironResourcefulModel){
  var rootURL = "/"
  this.rootURL = rootURL;
  this.resourceName = resourceName;
  this.model = flatironResourcefulModel;
}

InMemoryCollection.prototype = new Resource({}, 'resourceName');

InMemoryCollection.prototype.GET = function(req, res){
  var obj = this;
  var id = req.param('id');
  retrieve(this.model, id, function(err, modelObj){
    if (!!err){
      res.error.send(err.status, err.type, err.message, err.detail);
      return
    }
    res.show(modelObj.toJSON());
  });
}

function retrieve(model, id, cb){
  model.get(id, function (err, modelObj) {
    if (!!err) {
      if (err.status == 404){
        cb({ status : 404, 
             type : 'RecordNotFoundError', 
             message : 'A record with the given id could not be found.',
             detail : id});
        return
      } else { 
        console.log("unknown error:");
        console.log(err); 
        res.error.send(500, 'UnknownError', 'An unknown error occurred.', err);
        cb({ status : 500, 
             type : 'UnknownError', 
             message : 'An unknown error occurred.',
             detail : err});
        return
      }
    }
    cb(null, modelObj);
  });

}

InMemoryCollection.prototype.PUT = function(req, res){
  var obj = this;
  var id = req.param('id');
  retrieve(this.model, id, function(err, modelObj){
    if (!!err){
      res.error.send(err.status, err.type, err.message, err.detail);
      return
    }
    var body = JSON.parse(req.fullBody);
    var result = revalidator.validate(body, obj.model.schema);
    if (!result.valid){
      var err = result.errors;
      if (!!err[0].attribute && (err[0].attribute == 'required')){
        var required = _.pluck(err, 'property')
        return res.error.send(422, "ValidationError",
                                   "That document was invalid due to a missing required field", 
                                   required)
      } else {
        return res.error.send(500, "UnknownError", 'An unknown error occurred', err)
      }
    };
    modelObj.update(body, function(err){
      res.show(modelObj.toJSON());
    });
  });
}

InMemoryCollection.prototype.DELETE = function(req, res){
  var obj = this;
  var id = req.param('id');
  var model = this.model;
  retrieve(this.model, id, function(err, modelObj){
    if (!!err){
      res.error.send(err.status, err.type, err.message, err.detail);
      return
    }
    model.destroy(id, function(err){
      if (!!err){console.log(err); throw err;}
      res.send('', 204);
    });
  });
}

InMemoryCollection.prototype.collectionPOST = function(req, res){
  var obj = this;
  var json_type = 'application/json';
  var contentType = req.header('Content-Type');
  var error = false;
  // TODO should not be checking content-type here!  or should we?
  if (!contentType || contentType.substring(0, json_type.length) != json_type){
    res.send('IncorrectContentType', 415);  // TODO this error message sucks because it's non-json
    return
  }
  var body = req.jsonBody;
  //console.log("=================BODY============================");
  //console.log(body);
  var collection = this;
  this.preCreate(req, res, function(err, doc){
    //console.log("doc is: " + doc);
    if (!err){
      collection.model.create(doc, function(err, obj){
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
          if (!!err[0].attribute && (err[0].attribute == 'required')){
              var required = _.pluck(err, 'property')
              res.error.send(422, "ValidationError",
                                  "That document was invalid due to a missing required field", 
                                  required)
          } else {
              res.error.send(500, "UnknownError", 'An unknown error occurred', err)
          }
          return
        } else {
          collection.postCreate(req, res, function(err){
            res.header('Location',  req.originalUrl + '/' + obj.id);
            res.send('', 201);
          });
        }
      });
    }
  });
}


InMemoryCollection.prototype.finder = function(req){
  return this.schemaClass.find({});
}

InMemoryCollection.prototype.collectionGET = function(req, res){
  var obj = this;
  this.model.find({ }, function (err, docs) {
    if (!!err){console.log(err); throw err;}
    var items = _.map(docs, function(v, k){
      var links = {parent : {href : req.originalUrl}, self : {href: req.originalUrl + '/' + v._id}}
      return JSON.parse(res.representer.individual(v.toJSON(), links)); // TODO : fugly!!
    });
    res.show(items)
  });
}

exports.InMemoryCollection = InMemoryCollection;
