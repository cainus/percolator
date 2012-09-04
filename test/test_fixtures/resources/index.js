var _ = require('underscore');

exports.handler = {

  GET : function($){
    $.repr({
      _links: $.uri.links()
    });
  }


};
