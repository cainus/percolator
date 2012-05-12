var should = require('should');
var _ = require('underscore');

var percolator = require('../');
var DirRequirer = percolator.DirRequirer;

describe('DirRequirer', function(){
	beforeEach(function(){
	})
	afterEach(function(){
	})

  it ("returns an error if the given dir doesn't exist", function(done){
    var that = this;
    var dir = __dirname + '/test_fixtures/DOESNOTEXISTresources'
    var requirer = new DirRequirer(dir);
    requirer.require(function(err){
      err.type.should.equal("InvalidDirectory")
      err.message.should.equal("The given directory does not exist.")
      err.detail.should.equal(dir)
      done();
    });
  });
  it ("gets the dirs and files of a directory, ignoring non-js", 
    function(done){
      var dir = __dirname + '/test_fixtures/resources'
      var requirer = new DirRequirer(dir);
      requirer.require(function(err){
        if (err){console.log(err);}
        _.keys(requirer.paths).length.should.equal(9)
        should.exist(requirer.paths['/_index.js'])
        requirer.paths['/_index.js'].type.should.equal('file')
        done();
      });
    });

});

