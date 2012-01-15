const MongoResource = require('../resourceTypes/MongoResource').MongoResource;
const mongoose = require('mongoose');
Schema = mongoose.Schema;
var app = {}
exports.handler = new MongoResource(app, 'artists', {
    	'name' : { type: String, match: /[a-zA-z0-9\.]/ },
    	'created' :  { type: Date, default: Date.now },
    	'songs' : [{ type: Schema.ObjectId, ref: 'Songs' }]
})