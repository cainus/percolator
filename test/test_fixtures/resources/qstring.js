var resource = require('resorcery').resource;

exports.handler = {

  GET : function(req, res){
    res.end(JSON.stringify(this.uri.query()));
  }


};
