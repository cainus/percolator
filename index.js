var dir = './lib/';
if (process.env.PERCOLATOR_COVERAGE){
  dir = './lib-cov/';
}
var helperDir = dir + 'ContextHelpers/';

exports.StatusManager = require(dir + 'StatusManager');
exports.CRUDCollection = require(dir + 'CRUDCollection');

exports.AuthenticateHelper = require(helperDir + 'Authenticate');
exports.BasicAuthenticateHelper = require(helperDir + 'BasicAuthenticate');
exports.onJsonHelper = require(helperDir + 'onJson');
exports.FetchHelper = require(helperDir + 'Fetch');
exports.ContextFaker = require(dir + 'ContextFaker');
exports.Percolator = require(dir + 'Percolator');
