exports.handler = {
  GET : function($){
    $.jsonCollection([{"hello" : "collectors", "links" : $.req.uri.child('1234')}])
      .send();
  }
};

exports.wildcard = {
  GET : function($){
    $.res.end('1234');
  }
};
