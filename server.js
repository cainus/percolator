const express = require('express');
const mongoose = require('mongoose');
const Router = require('./lib/Router').Router;

// setup mongo
var mongo_url = 'mongodb://127.0.0.1:27017/percolator';
console.log('------------------------------------');
console.log('mongo_url: ' + mongo_url);
var db = mongoose.connect(mongo_url)


var app = express.createServer();

var port = process.env.PORT || 3000;
var portStr = ':' + port + '';
if (port == 80){portstr = '';}
app.set('base_path', 'http://localhost' + portStr + '/api');


var router = new Router(app, __dirname + '/resources', '/api/');
router.initialize(function(){
  app.listen(port, function(){
    console.log("Application started!");
  });
});
