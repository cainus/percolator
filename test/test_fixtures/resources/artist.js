/*

var Percolator = require('../../../');
var MongoResource = Percolator.MongoResource;

var app = {}
exports.handler = new MongoResource(app, 'artist', {
        'name' : { type: String, match: /[a-zA-z0-9\.]/, required : true },
        'created' :  { type: Date, default: Date.now, required : true }
})


*/
var resource = require('resorcery').resource;
var collection = require('resorcery').collection;

var artists = {
  '1234' : {"name" : "Neil Young", created : new Date()},
  '4567' : {"name" : "Joe Strummer", created : new Date()}
};
var artistCollection = new resource({
  POST : function(req, res){
    // TODO real implementation
    console.log('post');
    res.end();
  },
  GET : function(req, res){
    console.log('get');
    var out = { artist : [] }
    var linkPrefix = this.getAbsoluteUrl(req.headers.host, req.url);
    _.each(artists, function(v, k){
       var item = _.extend({ _links : { artist : {href : linkPrefix + "/" + k}} }, v)
       out.artist.push(item);
    });
    var parentUrl = this.router.getParentUrl(req.url);
    parentUrl = this.getAbsoluteUrl(req.headers.host, parentUrl);
    out._links = this.uri.links();
    this.repr(out)
  }
});

exports.handler = artistCollection;
exports.member = new resource({

  fetch : function(req, cb){
    console.log("in fetch");
    var id = this.router.pathVariables(req.url).artist;
    console.log('id');
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
    var id = this.router.pathVariables(req.url).artist;
    var row = artists[id];
    var selfLink = this.getAbsoluteUrl(req.headers.host, req.url);
    var parentUrl = this.router.getParentUrl(req.url);
    parentUrl = this.getAbsoluteUrl(req.headers.host, parentUrl);
    var item = { _links : { 
      self : {href : selfLink},
      parent : {href : parentUrl}
    } }
    var out = _.extend(item, row);
    this.repr(out);
  }

});
