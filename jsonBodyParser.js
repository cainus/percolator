/*
 Parse json request bodies.
*
* @return {Function}
* @api public
*/

exports = module.exports = function(){
  return function(req, res, next) {
    // GET/HEAD/DELETE doesn't use a request body
    if ('GET' == req.method || 'HEAD' == req.method || 'DELETE' == req.method){
        return next();
    }
    var contentType = req.headers['content-type'];
    if (!!contentType && contentType.indexOf('application/json') == 0){
        // it's json
        if (!!req.fullBody && req.fullBody != ''){
            try {
              req.jsonBody = JSON.parse(req.fullBody);
            } catch (err) {
              return next(err);
            }
        }
        return next();
    }
    return next();
  }
};
