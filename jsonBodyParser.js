/*
 Parse json request bodies.
*
* @return {Function}
* @api public
*/

var error = function(type, message, detail){
  var retval = { 'error' : { 'type' : type, 'message' : message} }
  if (detail == "" || !!detail){
     retval["error"]["detail"] = detail
  }
  return retval 
}


exports = module.exports = function(){
  return function(req, res, next) {
    // GET/HEAD/DELETE doesn't use a request body
    if ('GET' == req.method || 'HEAD' == req.method || 'DELETE' == req.method){
        return next();
    }
    var contentType = req.headers['content-type'];
    if (!!contentType && contentType.indexOf('application/json') == 0){
        // it's supposed to be json
        if (!!req.fullBody && req.fullBody != ''){
            try {
              req.jsonBody = JSON.parse(req.fullBody);
            } catch(err){
              var errDoc = error('MalformedJSON', 'The body of your request was not well-formed JSON.', req.fullBody + "");
              res.send(errDoc, 400);
              return;
            }
        }
        return next();
    }
    return next();
  }
};
