const MongoResource = require('../../resourceTypes/MongoResource').MongoResource;

var app = {}
exports.handler = new MongoResource(app, 'artists', {
        'name' : { type: String, match: /[a-zA-z0-9\.]/, required : true },
        'created' :  { type: Date, default: Date.now, required : true }
})
