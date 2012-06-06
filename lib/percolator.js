exports.Resource = require('./resourceTypes/Resource').Resource;
exports.MongoResource = require('./resourceTypes/MongoResource').MongoResource;
exports.rootRequire = function(path){
  return require(process.cwd() + '/' + path);
}
