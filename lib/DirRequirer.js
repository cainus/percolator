var fs = require('fs');
var walk = require('walk');
var _ = require('underscore')

var DirRequirer = function(dir){
  this.dir = dir;
  this.paths = {};
}

DirRequirer.prototype.require = function(cb){
  var that = this;
  this.paths = {};

  fs.stat(this.dir, function(err, stats){
    if (err){
      if (err.code == 'ENOENT'){
        return cb({type    : 'InvalidDirectory',
                   message : 'The given directory does not exist.',
                   detail  : that.dir})
      } else {
        return cb(err);
      }
    }

    var walker = walk.walk(that.dir);

    walker.on("directory", function (root, dirStatsArray, next) {
      var fullpath = root + '/' + dirStatsArray.name;
      var shortpath = fullpath.substring(that.dir.length)
      that.paths[shortpath] = { type : 'dir',
                                fullpath : fullpath};
      next();
    });

    walker.on("file", function (root, fileStats, next) {
      if (!endsWith(fileStats.name, '.js')){
        return next();
      }
      var fullpath = root + '/' + fileStats.name;
      var shortpath = fullpath.substring(that.dir.length)
      that.paths[shortpath] = {type : 'file',
                               fullpath : fullpath,
                               module : require(fullpath)};
      next();
    });

    walker.on("errors", function (root, nodeStatsArray, next) {
      cb(nodeStatsArray);
    });

    walker.on("end", function () {
      cb(null);
    });

  });
}


exports.DirRequirer = DirRequirer;

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

