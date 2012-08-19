/*

var Percolator = require('../../../');
var MongoResource = Percolator.MongoResource;

var app = {}
exports.handler = new MongoResource(app, 'artist', {
        'name' : { type: String, match: /[a-zA-z0-9\.]/, required : true },
        'created' :  { type: Date, default: Date.now, required : true }
})


*/
var Resource = require('resorcery').resource;
var collection = require('resorcery').collection;

var artists = {
  '1234' : {"name" : "Neil Young", created : new Date()},
  '4567' : {"name" : "Joe Strummer", created : new Date()}
};
var artistCollection = new Resource({
  POST : function(req, res){
    // TODO real implementation
    console.log('post');
    res.end();
  },
  GET : function(req, res){
    var out = { artist : [] };
    var that = this;
    _.each(artists, function(v, k){
       var item = _.extend({ _links : { self : {href : that.uri.get('artist*', {'artist' : k})} }}, v);
       out.artist.push(item);
    });
    out._links = this.uri.links();
    this.repr(out);
  }
});

exports.handler = artistCollection;
exports.member = new Resource({

  fetch : function(req, cb){
    console.log("in fetch");
    var id = this.uri.params().artist;
    console.log(id);
    var row = artists[id];
    console.log("row: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  },

  GET : function(req, res){
    console.log("fetched: ", this.fetched);
    var id = this.uri.param('artist');
    var row = artists[id];
    row._links = this.uri.links();
    this.repr(row);
  }

});
