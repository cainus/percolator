var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

var util = require('util');

var JsonResponder = function(req, res){
  this.req = req;
  this.res = res;
};
JsonResponder.prototype = Object.create(EventEmitter.prototype);

var errors = {
  'badRequest' :            {type : 400, message : 'Bad Request'},
  'unauthenticated' :       {type : 401, message : 'Unauthenticated'},
  'forbidden' :             {type : 403, message : 'Forbidden'},
  'notFound' :              {type : 404, message : 'Not Found'},
  'methodNotAllowed' :      {type : 405, message : 'Method Not Allowed'},
  'notAcceptable' :         {type : 406, message : 'Not Acceptable'},
  'conflict' :              {type : 409, message : 'Conflict'},
  'gone' :                  {type : 410, message : 'Gone'},
  'lengthRequired' :        {type : 411, message : 'Length Required'},
  'preconditionFailed' :    {type : 412, message : 'Precondition Failed'},
  'requestEntityTooLarge' : {type : 413, message : 'Request Entity Too Large'},
  'requestUriTooLong' :     {type : 414, message : 'Request URI Too Long'},
  'unsupportedMediaType' :  {type : 415, message : 'Unsupported Media Type'},
  'unprocessableEntity' :   {type : 422, message : 'Unprocessable Entity'},
  'tooManyRequests' :       {type : 429, message : 'Too Many Requests'},
  'internalServerError' :   {type : 500, message : 'Internal Server Error'},
  'notImplemented' :        {type : 501, message : 'Not Implemented'},
  'badGateway' :            {type : 502, message : 'Bad Gateway'},
  'serviceUnavailable' :    {type : 503, message : 'Service Unavailable'},
  'gatewayTimeout' :        {type : 504, message : 'Gateway Timeout'}
};


/* set methods on the JsonResponder for every kind of error that could occur.  */
_.each(errors, function(v, k){
  JsonResponder.prototype[k] = function(detail){
    var obj = {"error" : v};

    detail = detail || {};
    // if detail is circular, just flatten it to a string.
    try {
      JSON.stringify(detail);  // will throw if circular
    } catch(ex) {
      detail = util.inspect(detail);  // stringifies.  only goes one level deep.
    }

    obj.error.detail = detail;

    this.res.setHeader('Content-Type', 'application/json');
    this.res.writeHead(v.type);
    var out = JSON.stringify(obj);
    this.res.end(out);
    this.emit("error", { req : this.req, res : this.res, type : v.type, message : v.message, detail : detail } );
  };
});

JsonResponder.prototype.created = function(url){
  url = url || '';
  this.res.setHeader('Location', url);
  this.res.writeHead(201);
  this.res.end();
};

JsonResponder.prototype.accepted = function(){
  this.res.writeHead(202);
  this.res.end();
};

JsonResponder.prototype.noContent = function(){
  this.res.writeHead(204);
  this.res.end();
};

JsonResponder.prototype.resetContent = function(){
  this.res.writeHead(205);
  this.res.end();
};

JsonResponder.prototype.movedPermanently = function(url){
  this.redirect(url);
};

JsonResponder.prototype.redirect = function(url){
  url = url || '';
  this.res.setHeader('Location', url);
  this.res.writeHead(301);
  this.res.end();
};

JsonResponder.prototype.OPTIONS = function(methods){
    this.res.setHeader('Allow', methods.join(","));
    this.res.writeHead(200);
    return this.res.end(JSON.stringify({"allowed methods" : methods}));
};


module.exports = JsonResponder;
