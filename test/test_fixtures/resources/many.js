exports.handler = {
  GET : function($){
    $.repr({"items" : [{"hello" : "collectors", "links" : '/many/1234'}]});
  }
};

exports.member = {
  GET : function($){
    $.res.end('1234');
  }
};
