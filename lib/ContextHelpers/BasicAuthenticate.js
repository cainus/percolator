

var BasicAuthenticateContextHelper = function($, handler, cb){
  //  if handler has an authenticate defined, call it.
  if (!!handler.basicAuthenticate && (typeof(handler.basicAuthenticate) == 'function')){
    var header = $.req.headers.authorization;

    if (!header){
      return unauthenticated($);
    }

    var pieces = header.split(" ");
    var scheme = pieces[0];

    if (scheme !== 'Basic'){
      return unauthenticated($);
    }
    var credentials = new Buffer(pieces[1], 'base64').toString('utf8').split(":");

    handler.basicAuthenticate(credentials[0], credentials[1], $, function(err, authenticated){
      if (err === true){
        // if it returns an error, throw a 401
        return unauthenticated($);
      }
      if (!!err){
        return $.res.status.internalServerError(err);
      }
      // if it returns an object set handler.authenticated
      $.req.authenticated = authenticated;
      cb();  // no error
    });
  } else {
    cb();  // no error if no authenticate()
  }
};


module.exports = BasicAuthenticateContextHelper;

var unauthenticated = function($){
    $.res.setHeader('WWW-Authenticate', 'Basic');
    $.res.status.unauthenticated({scheme : 'Basic'});
};



