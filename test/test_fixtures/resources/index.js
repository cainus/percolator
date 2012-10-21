var _ = require('underscore');

exports.handler = {

  GET : function($){
    $.json({})
        .link('artists', $.uri.child('artist'))
        .link('happy', $.uri.child('happy'))
        .link('many', $.uri.child('many'))
        .link('qstring', $.uri.child('qstring'))
        .send();
  }


};
