const Percolator = require('../../../');
const Resource = Percolator.Resource;
const _ = require('underscore');


var app = {}
var resource = new Resource(app, 'cars')

var requiredFields = ['make', 'model', 'year'];
var optionalFields = ['topSpeed'];

resource.validator.setDocumentValidator(requiredFields, optionalFields);

resource.validator.addFieldValidator('year', function(value){
  return value > 1930
}, 'is later than 1930');

resource.collectionPOST = function(req, res){ 
	var doc = req.jsonBody;
  resource.preCreate(req, res, function(err, doc){
    if (!err) {
      res.send({}, 200)
    }
  })
}

exports.handler = resource;
