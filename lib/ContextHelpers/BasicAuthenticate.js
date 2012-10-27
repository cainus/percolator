

var BasicAuthenticateContextHelper = function($, handler, cb){
  //  if handler has an authenticate defined, call it.
  console.log("in helper");
  console.log('handler', handler);
  if (!!handler.basicAuthenticate && (typeof(handler.basicAuthenticate) == 'function')){
    console.log("in handler");
    var header = $.req.headers.authorization;

    if (!header){
      $.res.setHeader('WWW-Authenticate', 'Basic');
      return $.status.unauthenticated({scheme : 'Basic'});
    }

    var pieces = header.split(" ");
    var scheme = pieces[0];

    if (scheme !== 'Basic'){
      $.res.setHeader('WWW-Authenticate', 'Basic');
      return $.status.unauthenticated({scheme : 'Basic'});
    }
    var credentials = new Buffer(pieces[1], 'base64').toString('utf8').split(":");

    handler.basicAuthenticate(credentials[0], credentials[1], function(err, authenticated){
      if (err === true){
        // if it returns an error, throw a 401
        $.res.setHeader('WWW-Authenticate', 'Basic');
        return $.status.unauthenticated({scheme : 'Basic'});
      }
      if (!!err){
        return $.status.internalServerError(err);
      }
      // if it returns an object set handler.authenticated
      $.authenticated = authenticated;
      cb();  // no error
    });
  } else {
    cb();  // no error if no authenticate()
  }
};


module.exports = BasicAuthenticateContextHelper;




