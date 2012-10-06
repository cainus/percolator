
var should = require('should');
var StatusManager = require('../index').StatusManager;

describe("StatusManager", function(){
  it ("can be constructed", function(){
    var sm = new StatusManager();
    should.exist(sm);
  });
});
