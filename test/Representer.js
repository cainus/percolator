const Representer = require('../Representer').Representer;
const should = require('should');

describe("RepresentationBuilder", function(){
	describe("error builder", function(){
		it("throws an error when not given message", function(){
			var representer = new Representer();
			try { 
				representer.error("someerror"); 
				should.fail("expected exception was not raised!")
			} 
			catch (ex){ 
				ex.should.eql(new Error("MissingRequiredFields")) 
			}
		})

		it("returns a properly formatted json error block when given valid input", function(){
			var representer = new Representer();
			representer.error("SomeError", "Error message.").should.eql({"error":{"type":"SomeError", "message":"Error message."}})
		})

		it("returns a json error block with a detail", function(){
			var representer = new Representer();
			representer.error("SomeError", "Error message.", "detail").should.eql({"error":{"type":"SomeError", "message":"Error message.", "detail":"detail"}})
		})
	})
})