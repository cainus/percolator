const Resource = require('../../resourceTypes/Resource').Resource;
const _ = require('underscore');


var app = {}
var resource = new Resource(app, 'cars')

var requiredFields = ['make', 'model', 'year'];
var optionalFields = ['topSpeed'];


resource.setDocumentValidator(requiredFields, optionalFields);

resource.add_field_validator('year', function(value){
  return value > 1930
}, 'is later than 1930');

resource.collectionPOST = function(req, res){ 
	var doc = req.jsonBody;
  if (this.validate(res, doc)) {
  	res.send({}, 200)
  }
}

exports.handler = resource;