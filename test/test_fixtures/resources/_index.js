var resource = require('resorcery').resource;
var _ = require('underscore');

exports.handler = new resource({

  GET : function(req, res){
    var that = this;
    this.repr({
      _links: that.uri.links()
    });
  }


});
