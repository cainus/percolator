exports.handler = {

  GET : function($){
    $.res.end(JSON.stringify($.req.uri.query()));
  }


};
