var _ = require('underscore');

exports.handler = {

  GET : function(req, res){
    res.object({})
        .link('artists', req.uri.child('artist'))
        .link('teas', req.uri.child('teas'))
        .link('many', req.uri.child('many'))
        .link('qstring', req.uri.child('qstring'))
        .link('restricted', req.uri.child('restricted'))
        .link('remote', req.uri.child('remote'))
        .link('browser', req.uri.child('browser'))
        .send();
  }


};
