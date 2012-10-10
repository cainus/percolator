
var artists = {
  '1234' : {"name" : "Neil Young", created : new Date()},
  '4567' : {"name" : "Joe Strummer", created : new Date()}
};
exports.handler = {
  POST : function($){
    $.res.end();
  },
  GET : function($){
    var out = { artist : [] };
    _.each(artists, function(v, k){
      var self = $.uri.absolute('/api/artist/' + k);
      var item = _.extend({ _links : { self : {href : self } }}, v);
      out.artist.push(item);
    });
    out._links = $.uri.links();
    $.repr(out);
  }
};

exports.wildcard = {

  fetch : function(handler, cb){
    var id = handler.uri.params().artist;
    console.log("id was: ", id);
    var row = artists[id];
    console.log("row was: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  },

  GET : function($){
    $.fetched._links = $.uri.links();
    $.repr($.fetched);
  }

};
