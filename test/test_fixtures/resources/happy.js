exports.handler = {

  GET : function($){
    $.res.setHeader('Content-type','application/json');
    $.res.end(JSON.stringify($.uri.help()));
  }


};
