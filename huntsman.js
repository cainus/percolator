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
  this.beenThere.push(method + "|" + url);
  hottap(url).request(method, headers, body, function(err, response){
    if (err){
      that.emit('error', err);
      if (that.stopOnError){
        that.shouldStop = true;
      }
      cb(err);
    } else {
      if (that.debug){
        console.log('--> ', response);
      }
      that.emit('response', response);
      if (response.headers['content-type'] === 'application/json'){
        console.log("harvesting");
        that.harvest(response.body, function(){
          cb(response);
        });
      } else {
        if (that.debug){
          console.log('--> (non-json response)');
        }
        cb('non-json response', response);
      }
    }
  });
};

Huntsman.prototype.harvest = function(payload, cb){
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
      if (!that.hasBeenTo('GET', link.href)){
        that.capture(link.href, 'GET', {}, '', function(){
          cb();
        }); 
      }
    }
  });
};

Huntsman.prototype.hasBeenTo = function(method, url){
  return (this.beenThere.indexOf(method + '|' + url) !== -1);
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
  console.log(hunter.beenThere);
  console.log('done');
});

hunter.hunt("http://localhost:8080/api");

