var resourceful = require('resourceful');
var Percolator = require('../../../');
var InMemoryCollection = Percolator.InMemoryCollection;
var _ = require('underscore');

var City = resourceful.define('city', function () {
  this.use('memory');
  this.string('name', {required : true});
  this.string('country', {required : true});
});

var collection = new InMemoryCollection('city', City);

// for testing only
collection.clear = function(done){
  if (!done){console.log("missing done");}
  City.all(function(err, docs){
     City.all(function(err, objs){
      if (!!err){ console.log(err); throw err;}
      var count = objs.length;
      if (count == 0){return done();}
      _.each(objs, function(obj){
        City.destroy(obj._id);
        count--;
        if (count == 0){
          return done();
        }
      });
     });
  });
}


exports.handler = collection;
