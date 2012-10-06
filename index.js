var dir = './lib/';
if (process.env.PERCOLATOR_COVERAGE){
  dir = './lib-cov/';
}
var helperDir = dir + 'ContextHelpers/';

exports.JsonResponder = require(dir + 'JsonResponder');
exports.StatusManager = require(dir + 'StatusManager');
exports.UriUtil = require(dir + 'UriUtil');

exports.AuthenticateContextHelper = require(helperDir + 'Authenticate');
exports.BodyContextHelper = require(helperDir + 'Body');
exports.FetchContextHelper = require(helperDir + 'Fetch');
exports.Percolator = require(dir + 'Percolator');
