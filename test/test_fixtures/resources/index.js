var _ = require('underscore');

exports.handler = {

  GET : function($){
    $.repr({
      _links: {
        artists : $.uri.absolute('/api/artist'),
        happy : $.uri.absolute('/api/happy'),
        many : $.uri.absolute('/api/many'),
        qstring : $.uri.absolute('/api/qstring')
      }
    });
  }


};
