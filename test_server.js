var _ = require('underscore');
var Percolator = require('./index').Percolator;
var BasicAuthenticateHelper = require('./index').BasicAuthenticateHelper;

var app = {
  protocol : 'http',
  resourcePath : '/api',
  staticDir : __dirname + '/test/test_fixtures/static',
  port : 8080
};

app.artists = {
  1 : {"name" : "Neil Young", created : new Date()},
  2 : {"name" : "Joe Strummer", created : new Date()}
};


app.teas = [{name : "Earl Grey"}, {name : "Orange Pekoe"}, {name : "Lemon Zinger"}, {name : "English Breakfast"}];
app.teas = _.map(app.teas, function(tea){ tea.created = new Date(); return tea; });

var server = new Percolator(app);
server.before(function(req, res, handler, cb){
  req.started = new Date();
  BasicAuthenticateHelper(req, res, handler, function(){
    cb();
  });
});

server.after(function(req, res, handler){
  console.log(' <-- ', req.method, ' ', req.url, ' | duration: ' + (new Date() - req.started) + ' ms');
});

var resourceDir = __dirname + '/test/test_fixtures/resources';
server.routeDirectory(resourceDir, app.resourcePath, function(err){
  console.log("routed resources in " + resourceDir);

  server.connectMiddleware(function(req, res, done){
    console.log("hello from connect.  URL: ", req.url);
    done();
  });

  server.route('/inside', 
                      { GET : function(req, res){ 
                                res.end("muahahah!"); 
                              }
                      });
  server.route('/someProtectedPath', {
    basicAuthenticate : function(username, password, req, res, cb){
      // try to get the user here, based on cookie, Authentication header, etc
      if (username === 'Pierre' && password === 'Collateur'){
        return cb(null, {username : "Pierre", twitter_handle : "@Percolator"});
        // user object will be available in req.authenticated in all methods
      } else {
        return cb(true);  // Percolator will 401 for you
      }
    },
    GET : function(req, res){
      res.object({youAre : req.authenticated}).send();
    }
  });


  if (err) {
    console.log("Routing error");
    console.log(err);
    return;
  }
  server.on("response", function(data){
    console.log("response");
    console.log(data);
  });
  server.on("errorResponse", function(data){
    console.log("error response");
    console.log(data.req.method, data.req.url, data.type, data.message, data.detail);
  });
  server.listen(function(err){
    if (err) {console.log(err);throw err;}
    console.log('Percolator running on ' + server.port);
  });
});
