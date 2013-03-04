var CRUDCollection = require('../../../index').CRUDCollection;
_ = require('underscore');

module.exports = new CRUDCollection({

  schema : {
    description : "A musical artist",
    type : "object",
    properties : {
      name : {
        title : "The artist's name",
        type : "string",
        required : true
      }
    }
  },

  create : function($, obj, cb){
    console.log('creating: ', obj);
    obj.created = new Date();
    var newKey = parseInt(_.max(_.keys($.req.app.artists)), 10) + 1;
    $.req.app.artists[newKey] = obj;
    cb();
  },

  update : function($, id, obj, cb){
    console.log('updating: ', id, obj);
    $.req.app.artists[id] = obj;
    cb();
  },

  destroy : function($, id, cb){
    delete $.req.app.artists[id];
    cb();
  },

  list : function($, cb){
    cb(null, $.req.app.artists);
  },

  fetch : function($, cb){
    var id = $.uri.pathEnd();
    var row = $.req.app.artists[id];
    console.log("row was: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  }

});




