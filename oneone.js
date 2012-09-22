var http = require('http');
var https = require('https');
var Router = require('detour').Router;

var Server = function(resourcePath, port, protocol){
  this.port = port || 5000;
  this.protocol = protocol || 'http';
  this.router = new Router(resourcePath);
  this.coreServer = null;
  // TODO get resourcePath out of here, probably by getting it out of the router ctor
};

Server.prototype.route = function(path, handler){
  return this.router.route(path, handler);
};

Server.prototype.staticRoute = function(dir, cb){
  this.router.staticRoute(dir, cb);
};

// run the directory router and call the callback afterward
Server.prototype.routeDirectory = function(directory, cb){
  this.router.routeDirectory(directory, cb);
};

Server.prototype.listen = function(cb){
  var that = this;
  var router = this.router;
  var protocolLibrary = this.protocol === 'https' ? https : http;
  var coreServer = protocolLibrary.createServer(function(req, res){
      router.dispatch({req : req, res : res});
  });
  coreServer.listen(that.port, cb);
  that.coreServer = coreServer;
};

Server.prototype.close = function(cb){
  this.coreServer.close(cb);
};

exports.Server = Server;
