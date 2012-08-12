var resource = require('resorcery').resource;
var _ = require('underscore');

exports.handler = new resource({

  GET : function(req, res){
    console.log("accpet");
    console.log(req.headers.accept);
    console.log(req.headers.host);
    console.log("accpet");
    console.log(req);
    var that = this;
    var app = this.app;
    this.repr({
      _links: that.uri.links()
    });
  }


});
