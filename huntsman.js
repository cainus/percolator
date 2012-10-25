var EventEmitter = require('events').EventEmitter;
var hottap = require('hottap').hottap;
var _ = require('underscore');

var Huntsman = function(config){
  this.config = config || {};
  this.root = config.root || 'http://localhost/';
  this.readOnly = config.readOnly || true;
  this.maxItems = config.maxItems || 10;
  this.autoGET = config.autoGET || true;
  this.stopOnError = config.stopOnError || true;
  this.shouldStop = false;
  this.debug = config.debug || true;
  this.beenThere = []; // TODO populate this with places it's been
};

Huntsman.prototype = Object.create(EventEmitter.prototype);

Huntsman.prototype.capture = function(url, method, headers, body, cb){
  var that = this;
  method = method || "GET";
  body = body || '';
  headers = headers || {};
  cb = cb || function(){};
  if (this.debug){
    console.log('<-- ', method, headers, body);
  }
  hottap(url).request(method, headers, body, function(err, response){
    if (err){
      that.emit('error', err);
      if (that.stopOnError){
        that.shouldStop = true;
      }
    } else {
      if (that.debug){
        console.log('--> ', response);
      }
      that.emit('response', response);
      if (response.headers['content-type'] === 'application/json'){
        console.log("harvesting");
        that.harvest(response.body);
      } else {
        if (that.debug){
          console.log('--> (non-json response)');
        }
      }
      cb(err, response);
    }
  });
};

Huntsman.prototype.harvest = function(payload){
  var that = this;
  var obj = {};
  console.log("payload: ", payload);
  if (_.isString(payload)){
    try {
      obj = JSON.parse(payload);
    } catch(ex){
      that.emit('parseError', ex);
    }
  } else {
    obj = payload;
  }
  console.log("obj: ", obj);
  console.log("links: ", obj._links);
  _.each( obj._links, function(link, rel){
    console.log('eachlink: ', link, rel);
    that.emit('link', rel, link);
    if (!!that.autoGET && !that.shouldStop){
      console.log("about to follow... ", link);
    }
  });
};

Huntsman.prototype.hunt = function(url){
  var that = this;
  this.root = url || this.root;
  this.shouldStop = false;
  this.capture(this.root, 'GET', {}, '', function(){
    that.emit('end');
  });
};

var hunter = new Huntsman({ readOnly : false });

hunter.on('link', function(rel, linkObj){
  console.log("link: ", rel, ' ', linkObj);
});

hunter.on('error', function(err){
  console.log("error:", err);
});

hunter.on('parseError', function(err){
  console.log("error:", err);
});

hunter.on('response', function(response){
  console.log('response ', response);
});

hunter.on('end', function(){
  console.log('done');
});

hunter.hunt("http://localhost:8080/api");

