const express = require('express');
const mongoose = require('mongoose');
const fullBodyParser = require('./fullBodyParser');
const Router = require('./Router').Router;


var app = express.createServer();
var port = 3000
app.configure(function(){
  app.use(fullBodyParser());
});

var router = new Router(app, 'http://localhost:' + port + '/', __dirname + '/resources');

var mongo_url = 'mongodb://127.0.0.1:27017/percolator';
console.log('------------------------------------');
console.log('mongo_url: ' + mongo_url);
var db = mongoose.connect(mongo_url)

app.listen(port);
