/*
 This context helper just adds an onJson function to the
 context and calls back when done.

 As a last or only parameter, the onJson function takes a 
 callback in the form:
 function(err, body){ ...
 where error is an error that may have occurred and body
 is the entire body of the request.

 An optional first parameter representing a json schema as
 an object is also allowed.  If specified it will be used 
 for validation.

 */
var _ = require('underscore');
var JSV = require('JSV').JSV;


var JsonBodyContextHelper = function($, handler, cb){
  $.onJson1234 = function(){
  /*

    var args = _.toArray(arguments);
    var schema, onBodyCB;
    switch(args.length){
      case 1:
        onBodyCB = args[0];
        break;

      case 2:
        schema = args[0];
        onBodyCB = args[1];
        break;

      default : throw "$.onJson() was called with the wrong number of properties.";
    }

    var body = '';
    $.req.on('data', function(data){
      body += data;
    });
    $.req.on('error', function(err){
      return onBodyCB(err, body);
    });
    $.req.on('end', function(){
      var obj;
      try {
        obj = JSON.parse(body);
      } catch(ex) {
        // if it's not valid JSON...
        return $.status.badRequest('invalid json.', body);
      }
      if (!!schema){
        var report = JSV.createEnvironment().validate(obj, options.createSchema);
        if (report.errors.length > 0){
          return $.status.badRequest('json failed schema validation.', report.errors);
        }
      }

      return onBodyCB(null, obj);
    });
  */
  };
  cb();
};


module.exports = JsonBodyContextHelper;




