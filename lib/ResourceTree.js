const _ = require('underscore');
const fs = require('fs');

var ResourceTreeNode = function(path, module, parentNode){
  this.parentNode = parentNode || null;
  this.path = path;
  this.module = module;
  this.children = [];
}

ResourceTreeNode.prototype._validateDirectory =function(dir){
  try {
    var stats = fs.lstatSync(dir);
  } catch (err){
    if (err.code == 'ENOENT'){
      throw "resource_dir parameter was not a valid directory: " + dir
    } else {
      throw err;
    }
  }
  if (!stats.isDirectory()){
    throw "resource_dir parameter was not a valid directory: " + dir
  }
}

ResourceTreeNode.prototype.addChild = function(path, module){
  var kid = new ResourceTreeNode(path, module, this)
  this.children.push(kid);
  return kid;
}
/*
function addFile(node, dir, resource, done){
  var kid = node.addChild(resourceName, {});
  var dir = root_dir + '/' + resourceName
  console.log("checking sub: " + dir);
  try {
    this._validateDirectory(dir);
  } catch (ex) {
    waitFor--;
    if (waitFor < 1){
      return cb(null)
    }
  }
  kid.fromFileSystem(dir, function(){
    waitFor--;
    if (waitFor < 1){
      return cb(null)
    }
  });
  
  done();
}*/

ResourceTreeNode.prototype.fromFileSystem = function(root_dir){
  var node = this;
  this._validateDirectory(root_dir);
  var files = fs.readdirSync(root_dir);
  _.each(files, function(file){
    if (!endsWith(file, ".js")) {
        return;
    }
    var resourceName = file.substring(0, file.length - 3)
    var kid = node.addChild(resourceName, {});
    var dir = root_dir + '/' + resourceName
    try {
      kid._validateDirectory(dir);
      kid.fromFileSystem(dir);
    } catch (ex) {
      //do nothing.  if there's no dir, end recursion.
    }
  });
}

ResourceTreeNode.prototype.toString = function(depth){
  var depth = depth || 1;
  //show the tree as a nicely formatted string
  var str = '[Resource ' + this.path + ']';
  var indent = (new Array(depth + 1)).join("-");
  _.each(this.children, function(kid){
    str += '\nL' + indent + kid.toString(depth + 1);
  })
  return str;
}

var ResourceTree = function(){
  this.parentNode = null;
  this.path = '/';
  this.module = {};
  this.children = [];

}
ResourceTree.prototype = new ResourceTreeNode('/', {});
ResourceTree.prototype.constructor = ResourceTree;




function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}


exports.ResourceTree = ResourceTree;

