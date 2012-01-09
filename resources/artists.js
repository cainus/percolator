const mongoose = require('mongoose');
const SchemaResource = require('../SchemaResource').SchemaResource;


var Artists = new mongoose.Schema({
    'name' : { type: String, match: /[a-zA-z0-9\.]/ },
    'created' :  { type: Date, default: Date.now }
});
var ArtistClass = mongoose.model('Artists', Artists);


var handler = new SchemaResource(ArtistClass, 'http://localhost:3000', 'artists');
exports.handler = handler;