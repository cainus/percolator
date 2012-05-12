var fs = require('fs');
var DirRequirer = require('./DirRequirer').DirRequirer;
var _ = require('underscore');

var FSRouter = function(d, dir){
  this.d = d;  // requires a detour router for input;
  this.requirer = new DirRequirer(dir);
  this.dir = dir;
  this.paths = [];
}

FSRouter.prototype.route = function(cb){
  var that = this;
  var requirer = this.requirer;
  requirer.require(function(err){
    if (err) {
      return cb(err);
    }
    that.paths = requirer.paths;
    console.log(requirer.paths);
    if (!_.include(_.keys(requirer.paths), '/_index.js')){
      return cb(error('MissingIndexResource',
            'There was no _index.js at the given path.  This is the first necessary resource file.',
           that.dir));
    }
    var keys = _.keys(that.paths)
    console.log(keys);
    for (var i = 0; i < keys.length ; i++){
      var path = keys[i];
      var obj = that.paths[path];
      if (obj.type === 'file'){
        var name = pathToName(path);
        var url = pathToUriPath(path);
        console.log("routing: " + url + " as " + name);
        that.d.route(url, obj.module).as(name);
      } else {
        // it's a dir
        if (!_.include(keys, path + '.js')){
          var dirModuleName = pathToName(path) + '.js';
          return cb(
            error('MissingDirectoryResource',
            'There was no directory resource for one of the directories.  All directories to be routed must have a directory resource.',
            'Found ' + path + ', but no "' + dirModuleName  + '" next to it.'
          ));
        }
      }
    };
    return cb();
  });
}

exports.FSRouter = FSRouter;

var error = function (type, message, detail){
  return {type : type, message : message, detail : detail}
}

var pathToName = function(path){
  console.log('in path', path);
  if (path == '/_index.js'){
    return 'root';
  } else {
    console.log('other path', path);
    var match = path.match(/[A-Za-z0-9\/]+/)
    match = match[0]
    console.log('match', match);
    if (match[0] + '' == '/'){
      match = match.substring(1)
    }
    match = match.replace(/\//g, '_')
    return camelCase(match);
  }
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var pathToUriPath = function(path){
  if (path == '/_index.js'){
    return '/';
  } else {
    return truncate(path, 3);
  };
}

var truncate = function(str, count){
  return str.substring(0, str.length - count)
}

var camelCase = function(str){
	return str.replace(/(_[a-z])/g, function($1){return $1.toUpperCase().replace('_','');});
};
