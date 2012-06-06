var resource = require('resorcery').resource;
var _ = require('underscore');

exports.handler = new resource({

  GET : function(req, res){
    console.log("accpet");
    console.log(req.headers.accept);
    console.log(req.headers.host);
    console.log("accpet");
    var links = this.router.getNamedChildUrls(req.url)
    console.log(links);
    console.log(req);
    var that = this;
    var app = this.app;
    _.each(links, function(v, k){
      links[k] = {href : that.getAbsoluteUrl(req.headers.host, v) };
    });
    links.self = {href : that.getAbsoluteUrl(req.headers.host, req.url) }
    console.log(links);
    this.repr(req, res, {
      _links: links
    });
  }


});
