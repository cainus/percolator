/*

The purpose of the fetch helper is to use 
a resource-defined fetch() method and automatically retrieve
the requested data, or show appropriate error messages.

If fetch() is not defined on the resource, there will be no 
effect all.

If you find that you want to do your own error handling, this
helper is probably unnecessary as it will do little 
else other than setting req.fetched for you.

*/



var FetchHelper = function(req, res, handler, cb){

  if (!req.fetched && !!handler.fetch && (typeof(handler.fetch) == 'function')){
    if (req.method !== "PUT" || handler.fetchOnPUT !== false){
      handler.fetch(req, res, function(err, fetched){
        if (err === true){
          // if it returns an error, throw a 404
          return res.status.notFound(req.url);
        }
        if (!!err){
          return res.status.internalServerError(err);
        }
        req.fetched = fetched;
        return cb();
      });
    } else {
      return cb();
    }
  } else {
    return cb();
  }
};

module.exports = FetchHelper;




