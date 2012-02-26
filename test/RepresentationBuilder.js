const Builder = require('../RepresentationBuilder').Builder;
const should = require('should');

describe("RepresentationBuilder", function(){
	describe("error builder", function(){
		it("throws an error when not given message", function(){
			var builder = new Builder();
			builder.error("SomeError", null, null, function(err ,res){
				err.should.exist
			})
		})

		it("returns a properly formatted json error block when given valid input", function(){
			var builder = new Builder();
			builder.error("SomeError", "Error message.", null, function(err, res){
				should.not.exist(err)
				res.should.eql({"error":{"type":"SomeError", "message":"Error message."}})
			})
		})

		it("returns a json error block with a detail", function(){
			var builder = new Builder();
			builder.error("SomeError", "Error message.", "detail", function(err, res){
				should.not.exist(err)
				res.should.eql({"error":{"type":"SomeError", "message":"Error message.", "detail":"detail"}})
			})
		})
	})
})