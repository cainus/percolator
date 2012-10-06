

var AuthenticateContextHelper = function($, handler, cb){
  //  if handler has an authenticate defined, call it.
  if (!!handler.authenticate && (typeof(handler.authenticate) == 'function')){
    handler.authenticate($, function(err, authenticated){
      if (err === true){
        // if it returns an error, throw a 401
        return $.status.unauthenticated();
      }
      if (!!err){
        return $.status.internalServerError(err);
      }
      // if it returns an object set handler.fetched
      $.authenticated = authenticated;
      cb();  // no error
    });
  } else {
    cb();  // no error if no authenticate()
  }
};


module.exports = AuthenticateContextHelper;




