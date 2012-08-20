var Resource = require('resorcery').resource;

exports.handler = new Resource({

  GET : function(req, res){
    res.end(JSON.stringify(this.uri.help()));
  }


});
