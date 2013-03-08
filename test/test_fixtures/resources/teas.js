var CRUDCollection = require('../../../index').CRUDCollection;
_ = require('underscore');

module.exports = new CRUDCollection({

  schema : {
    description : "A tea flavour",
    type : "object",
    properties : {
      name : {
        title : "The tea flavour's name",
        type : "string",
        required : true
      }
    }
  },

  create : function($, obj, cb){
    console.log('creating: ', obj);
    obj.created = new Date();
    $.req.app.teas.push(obj);
    cb();
  },

  update : function($, id, obj, cb){
    console.log('updating: ', id, obj);
    $.req.app.teas[id] = obj;
    cb();
  },

  destroy : function($, id, cb){
    delete $.req.app.teas[id];
    cb();
  },

  list : function($, cb){
    cb(null, $.req.app.teas, 'name');
  },

  fetch : function(req, res, cb){
    var id = req.uri.child();
    var row = req.app.teas[id];
    console.log("row was: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  }

});




