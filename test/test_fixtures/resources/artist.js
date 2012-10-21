var schema = {
  description : "A musical artist",
  type : "object",
  properties : {
    name : {
      title : "The artist's name",
      type : "string"
    }
  }
};


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
    /*
    TODO : 
           get rid of uriutil.links
           kill reaper and $.repr once send() works
           can schema be re-used for validations?
           create a badass collection object
           tarantula - finds undocumented rels, unhittable endpoints, api errors, valid urls
           viewer like jsonviewer
           api time-cost report
           adding prefixes for child links sucks.  how about $.uri.child('rest');
           how to document rels easily?
     */
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
      //.link( "artist-update", $.uri.self(),{method : 'PUT', schema : schema})
      .send();
      /*
    $.fetched._links = $.uri.links();
    $.fetched._forms = { "artist-update" : {method : 'PUT', action : $.uri.self(), schema : schema}};
    $.repr($.fetched);*/
  }

};
