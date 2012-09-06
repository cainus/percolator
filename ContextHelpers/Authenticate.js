

var AuthenticateContextHelper = function($, cb){
  //  if handler has a fetch defined, call it.
  if (!!$.authenticate && (typeof($.authenticate) == 'function')){
    $.authenticate($, function(err, authenticated){
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




