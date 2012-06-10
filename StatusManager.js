_ = require('underscore');

var StatusManager = function(){
  this.registry = {};
}

StatusManager.prototype.register = function(contentType, responder){
  this.registry[contentType] = responder;
}

StatusManager.prototype.createResponder = function(req, res){
  // TODO make this do conneg and pick a responder from the registry!
  return new JsonResponder(req, res);
}


// TODO make default test/plain, text/html, application/xml responders

var JsonResponder = function(req, res){
  this.req = req;
  this.res = res;
}

var errors = {
  'internalServerError' : {type : 500, message : 'Internal Server Error'},
  'notImplemented' :      {type : 501, message : 'Not Implemented'},
  'serviceUnavailable' :  {type : 503, message : 'Service Unavailable'},
  'badRequest' :          {type : 400, message : 'Bad Request'},
  'unauthenticated' :     {type : 401, message : 'Unauthenticated'},
  'forbidden' :           {type : 403, message : 'Forbidden'},
  'notFound' :            {type : 404, message : 'Not Found'},
  'methodNotAllowed' :    {type : 405, message : 'Method Not Allowed'},
  'notAcceptable' :       {type : 406, message : 'Not Acceptable'},
  'conflict' :            {type : 409, message : 'Conflict'},
  'gone' :                {type : 410, message : 'Gone'},
  'lengthRequired' :      {type : 411, message : 'Length Required'},
  'preconditionFailed' :  {type : 412, message : 'Precondition Failed'},
  'requestEntityTooLarge' : {type : 413, message : 'Request Entity Too Large'},
  'requestUriTooLong' :   {type : 414, message : 'Request URI Too Long'},
  'unsupportedMediaType' : {type : 415, message : 'Unsupported Media Type'},
  'unprocessableEntity' : {type : 422, message : 'Unprocessable Entity'},
  'tooManyRequests' :     {type : 429, message : 'Too Many Requests'}
}

_.each(errors, function(v, k){
  JsonResponder.prototype[k] = function(detail){
    var obj = {"error" : v};
    obj.error.detail = detail || {};
    this.res.setHeader('Content-Type', 'application/json');
    this.res.setHeader('Allow', 'POST');
    this.res.writeHead(v.type);
    var out = JSON.stringify(obj)
    this.res.end(out);
  }
});

JsonResponder.prototype.OPTIONS = function(methods){
    this.res.setHeader('Allow', methods.join(","));
    this.res.writeHead(200);
    return this.res.end(JSON.stringify({"allowed methods" : methods}));
}


exports.StatusManager = StatusManager;
exports.JsonResponder = JsonResponder;
