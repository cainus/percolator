/*
 Parse request bodies.
*
* @return {Function}
* @api public
*/

exports = module.exports = function fullBodyParser(){
  return function fullBodyParser(req, res, next) {
    if (req.fullBody) return next();
    
    // GETs and HEADs don't care about request bodies
    if ('GET' == req.method || 'HEAD' == req.method){
        return next();
    }

    console.log("Content-Type:" + req.headers['content-type']);
    var contentType = req.headers['content-type'];
    if (!!contentType && contentType.indexOf('application/x-www-form-urlencoded') == 0){
        // it's a form post
        return next();
    }

    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function(){
        try {
          req.fullBody = data
          return next();
        } catch (err) {
          return next(err);
        }
    });
  }
};
