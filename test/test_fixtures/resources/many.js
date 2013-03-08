exports.handler = {
  GET : function(req, res){
    res.collection([{"hello" : "collectors", "links" : req.uri.child('1234')}])
      .send();
  }
};

exports.wildcard = {
  GET : function(req, res){
    res.end('1234');
  }
};
