var fs = require('fs');
var express = require('express');
var Router = require('detour').Router;
var Reaper = require('reaper').Reaper;
var StatusManager = require('./StatusManager').StatusManager;
var JsonResponder = require('./StatusManager').JsonResponder;
var resource = require('resorcery').resource;
var _ = require('underscore');

// TODO why is there 404 output to the console on every request?
// TODO collections proof-of-concept - POST, PUT, DELETE
// TODO make status man do conneg
// TODO producers of app/json should respond to requests for app/blah+json
// TODO res and req on the resource object itself (and not passed in?)
// == low priority ==
// TODO better error output when there's an error in mediaTypes, resources, etc.
// TODO how to put content-type in links
// TODO form post for create
// TODO better errors when you try to getUrl an unknown route
// TODO better way to see all routes

var server;
var resourceDirectory = __dirname + '/test/test_fixtures/resources'
console.log(resourceDirectory);
var router = new Router();

var getMethods = function(resource){
  var moduleMethods = _.functions(resource);
  var methods = _.intersection(moduleMethods, serverSupportedMethods);
  var additionalMethods = ['OPTIONS']
  if (_.isFunction(resource.GET)){
    additionalMethods.push('HEAD');
  }
  methods = _.union(additionalMethods, methods);
  return methods;
};

var serverSupportedMethods = ["GET", "POST", 
                              "PUT", "DELETE",
                              "HEAD", "OPTIONS"];

var app = {
  protocol : 'http'
  ,port : 8080
}


var mediatypes = new Reaper();

var jsonType = require('./mediaTypes/json');
mediatypes.register('application/json', jsonType.in, jsonType.out);
//var xmlType = require('./mediaTypes/xml');
//mediatypes.register('application/xml',xmlType.in, xmlType.out);

var statusman = new StatusManager();
statusman.register('application/json',  JsonResponder);

router.handle414 = function(req, res){
  statusman.createResponder(req, res).requestUriTooLong()
};

router.handle404 = function(req, res){
  // TODO fix resource.fetch to use this handle404 instead of default!!!
  console.log("four oh four");
  var responder = statusman.createResponder(req, res)
  console.log('responder.notFound');
  console.log(responder.notFound);
  responder.notFound()
};

router.handle405 = function(req, res){
  statusman.createResponder(req, res).methodNotAllowed()
};

router.handle501 = function(req, res){
  statusman.createResponder(req, res).notImplemented()
};

router.handle500 = function(req, res, ex){
  statusman.createResponder(req, res).internalServerError()
};

router.on("route", function(resource){
  resource.router = router;
  if (!!resource.input){
    resource.input.OPTIONS = function(req, res){
      var responder = statusman.createResponder(req, res);
      return responder.OPTIONS(getMethods(resource.input));
    }
  }
  if (!resource.handle404){
    resource.handle404 = function(req, res){
      this.router.handle404(req, res);
    }
  }
  resource.app = app;
  resource.getAbsoluteUrl = function(hostname, path){
    var abs = app.protocol + '://' + hostname + path;
    console.log(abs);
    return abs;
  }
  resource.repr = function(req, res, data){
    console.log('in repr');
    console.log(req.headers.accept);
    console.log('data');
    console.log(data);
    console.log(mediatypes);
    var obj = mediatypes.out(req.headers.accept, data);
    console.log('obj');
    console.log(obj);
    res.setHeader('content-type', obj.type);
    res.send(obj.content)
  }
});

router.routeDirectory(resourceDirectory, function(err){
  if (err) {console.log(err);throw err;}

  server = express.createServer();

  server.configure(function(){
      server.use(express.bodyParser());
      server.use(function(req, res, next){
        console.log(req.method, ' ', req.url);
        next();
      });
      server.use(router.connectMiddleware);
  });


  console.log(router);

  var happyrez = new resource({

    GET : function(req, res){
      console.log("HERE!!!!!!!!!!!!!!!");
      console.log("pre end");
      res.end('this worked');
      console.log("post end");
    }

  });

  server.get('/res/', function(req, res){happyrez.GET(req, res)})
  server.put('/res/', function(req, res){happyrez.PUT(req, res)})
  server.post('/res/', function(req, res){happyrez.POST(req, res)})
  server.del('/res/', function(req, res){happyrez.DELETE(req, res)})
  server.options('/res/', function(req, res){happyrez.OPTIONS(req, res)})

  server.listen(8080);
  console.log('express with detour running on 8080');

});

