exports.handler = {
  GET : function($){
    $.jsonCollection([{"hello" : "collectors", "links" : $.uri.absolute('/api/many/1234')}])
      .send();
  }
};

exports.wildcard = {
  GET : function($){
    $.res.end('1234');
  }
};
