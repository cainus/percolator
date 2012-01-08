/**
* Percolator
* Webmachine-esque middleware for RESTful APIs.
*
* @return {Function}
* @api public
*/

exports = module.exports = function percolator(options){
  options = options || {"available" : true}
  var knownMethods = ["GET", "HEAD", "POST", "PUT", "DELETE", "TRACE", "CONNECT", "OPTIONS"]

  return function (req, res, next) {
    // may use 'root' here if necessary...
    if (!options.available){
      res.send('Service Unavailable.  This service is in "unavailable" mode.', 503);
    } else {
      if (!~knownMethods.indexOf(req.method.toUpperCase())){
        res.send('Not Implemented.  That is not a known method.', 501);
      } else {
        if (req.url.length > 4096){
          res.send('Request URI Too Long.', 414);
        } else {
          return next();
        }
      }
    }
  }
};

