exports.handler = {
  GET : function($){
    $.repr({"items" : [{"hello" : "collectors", "links" : '/many/1234'}]});
  }
};

exports.wildcard = {
  GET : function($){
    $.res.end('1234');
  }
};
