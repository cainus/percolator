var should = require('should');
var percolator = require('../');
var ResourceTree = percolator.ResourceTree;

describe('ResourceTree', function(){ 

  beforeEach(function(done){
     this.resourceDir = __dirname + '/test_fixtures/resources';
     done();
  });

  describe("#toString", function(){
    it ("should return an empty resource tree as a string", function(done){
      var tree = new ResourceTree();
      tree.toString().should.equal("[Resource /]");
      done();
    });
    it ("should return a one-resource tree as a string", function(done){
      var tree = new ResourceTree();
      tree.addChild('someresource', {})
      tree.toString().should.equal("[Resource /]\nL-[Resource someresource]");
      done();
    });
    it ("should return a many-resource tree as a string", function(done){
      var tree = new ResourceTree();
      tree.addChild('someresource', {})
      tree.addChild('someotherresource', {})
      tree.toString().should.equal("[Resource /]\nL-[Resource someresource]\nL-[Resource someotherresource]");
      done();
    });
    it ("should return a 3-deep-resource tree as a string", function(done){
      var tree = new ResourceTree();
      var kid = tree.addChild('someresource', {})
      kid.addChild("deepkid", {})
      tree.addChild('someotherresource', {})
      tree.toString().should.match(/L-\[Resource someresource\]/)
      tree.toString().should.match(/L--\[Resource deepkid\]/)
      tree.toString().should.match(/L-\[Resource someotherresource\]/)
      tree.toString().should.match(/^\[Resource \/\]/);
      done();
    });
  });

  describe("#fromFileSystem", function(){
    it ("calls back with an exception when the resource directory doesn't exist", function(done){
      var tree = new ResourceTree();
      try {
        tree.fromFileSystem(__dirname + '/../test_fixtures/doesNotExist');
        should.fail("expected exception did not fire");
      } catch(ex){
        should.exist(ex);
        ex.should.match(/^resource_dir parameter was not a valid directory:/);
        done();
      }
    });
    it ("should load in a hierarchy from the filesytem", function(done){
      var tree = new ResourceTree();
      tree.fromFileSystem(this.resourceDir);
      tree.toString().should.match(/L--\[Resource album\]/);
      tree.toString().should.match(/L-\[Resource artist\]/);
      done();
    })
  });
});
