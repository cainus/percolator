const mongoose = require('mongoose');
const SchemaResource = require('../SchemaResource').SchemaResource;


var Songs = new mongoose.Schema({
    'name' : { type: String, match: /[a-zA-z0-9\.]/ },
    'created' :  { type: Date, default: Date.now }
});
var SongClass = mongoose.model('Songs', Songs);


var handler = new SchemaResource(SongClass, 'http://localhost:3000', 'songs');
exports.handler = handler;