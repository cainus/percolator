const Representer = require('../Representer').Representer;
const should = require('should');

describe("Representer", function(){
		
	beforeEach(function(){
		this.representer = new Representer();
	})

  describe("options representation builder", function(){
		it("takes an array of allowed methods and returns a simple json object", function(){
      var json = this.representer.options(["GET", "POST"])
      JSON.parse(json).should.eql({"Allowed" : ["GET", "POST"]})
		})
  })
	
	describe("error representation builder", function(){

		it("throws an error when not given message", function(){
			try { 
				this.representer.error("someerror"); 
				should.fail("expected exception was not raised!")
			} 
			catch (ex){ 
				ex.should.equal("MissingRequiredFields") 
			}
		})

		it("returns a properly formatted json error block when given valid input", function(){
			JSON.parse(this.representer.error("SomeError", "Error message."))
        .should.eql({"error":{"type":"SomeError", "message":"Error message."}})
		})

		it("returns a json error block with a detail", function(){
			JSON.parse(this.representer.error("SomeError", "Error message.", "detail"))
        .should.eql({"error":{"type":"SomeError", "message":"Error message.", "detail":"detail"}})
		})
	})

	describe("individual representation builder", function(){

		it("throws an error if not given a self link", function(){
			var object = { "hello": "world", "goodbye": "moon" }
			var links = { "parent": { "href": "somelink"} }
			try { 
				this.representer.individual(object, links)
				should.fail("expected exception was not raised!")
			}
			catch(ex){ ex.should.equal("MissingSelfLink") }
		})

		it("returns a links hash in the representation", function(){
			var object = { "hello": "world"}
			var links = { "self": { "href": "selflink"} }
			var res = JSON.parse(this.representer.individual(object, links))
			res.should.eql({
				"hello": "world", 
				"links": {
					"self": {"href": "selflink"}
				}
			})
		})
	})

	describe("collection representation builder", function(){

		beforeEach(function(){
			this.object = { "hello": "world", "links": {"self": { "href": "selflink"}} }
		})

		it("throws an error if no collection self link is present", function(){
			try { 
				this.representer.collection("messages", [this.object], {"parent": {"href": "parentLink"}})
				should.fail("expected exception was not raised!")
			}
			catch(ex){ ex.should.equal("MissingSelfLink") }
		})

		it("returns the objects in a named array and the collection links", function(){
			var res = JSON.parse(this.representer.collection("messages", [this.object], {"self": {"href": "collectionselflink"}}))
			res.should.eql({ "messages": [ 
				{ "hello": "world", 
					"links": {
						"self": { "href": "selflink" }
					}
				}],
				"links": {
					"self": { "href": "collectionselflink" }
				}
			})
		})

		it("throws an error if no first page link is present but pagination is present", function(){
			try { 
				this.representer.collection("messages", [this.object], {"self": {"href": "collectionselflink"}}, 
				20, { "prev": { "href": "prevPage"}, "next": {"href": "nextPage"} })
				should.fail("expected exception was not raised!")
			}
			catch(ex){ ex.should.equal("MissingFirstPageLink") }
		})

		it("returns the collection with pagination when page size and page links are provided", function(){
			var res = this.representer.collection("messages", [this.object], {"self": {"href": "collectionselflink"}}, 
				20, { "first": { "href": "firstPage"}, "next": {"href": "nextPage"} })
      res = JSON.parse(res);
			res.should.eql({ 
				"messages": [ 
					{ "hello": "world", 
						"links": {
							"self": { "href": "selflink" }
						}
					}
				],
				"links": {
					"self": { "href": "collectionselflink" }
				},
				"pagination": {
					"maxPageSize": 20,
					"links": {
						"first": { "href": "firstPage" },
						"next": { "href": "nextPage" }
					}
				}
			})
		})

	})
})
