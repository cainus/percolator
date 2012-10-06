_ = require('underscore');
JsonResponder = require('../index').JsonResponder;
var EventEmitter = require('events').EventEmitter;

var StatusManager = function(){
  this.registry = {};
};

StatusManager.prototype = Object.create(EventEmitter.prototype);

StatusManager.prototype.register = function(contentType, responder){
  this.registry[contentType] = responder;
};

StatusManager.prototype.createResponder = function(req, res){
  // TODO make this do conneg and pick a responder from the registry!

  // TODO make default text/plain, text/html, application/xml,
  // application/octet-sctream, form-url-encoded responders
  var responder = new JsonResponder(req, res);
  var that = this;
  responder.on('error', function(data){
    that.emit('error', data);
  });
  return responder;
};

module.exports = StatusManager;
