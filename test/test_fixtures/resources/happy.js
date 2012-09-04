exports.handler = {

  GET : function($){
    $.res.end(JSON.stringify($.uri.help()));
  }


};
