var JsonModule = require('../../../index').JsonModule;


module.exports = new JsonModule({

  schema : {
    description : "A musical artist",
    type : "object",
    properties : {
      name : {
        title : "The artist's name",
        type : "string"
      }
    }
  },

  list : function($, cb){
    cb(null, $.app.artists);
  },

  fetch : function($, cb){
    var id = $.uri.params().artist;
    console.log("id was: ", id);
    var row = $.app.artists[id];
    console.log("row was: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  }

});

/*


exports.handler = {
  POST : function($){
    $.res.end();
  },
  GET : function($){
      $.jsonCollection($.app.artists)
        .linkEach('self', function(item, name){
          return $.uri.child(name);
        })
        .link('artist-add', $.uri.self(), {method : 'POST', schema : schema})
        .send();
  }
};

exports.wildcard = {

  fetch : function($, cb){
    var id = $.uri.params().artist;
    console.log("id was: ", id);
    var row = $.app.artists[id];
    console.log("row was: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  },

  GET : function($){

    console.log("FETCHED: ", $.fetched);
    $.json($.fetched)
      .link( "artist-update", $.uri.self(),{method : 'PUT', schema : schema})
      .send();
  }

};*/



