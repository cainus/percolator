const express = require('express');
const mongoose = require('mongoose');
const fullBodyParser = require('./fullBodyParser');
const Router = require('./Router').Router;


var app = express.createServer();
var port = 3000
app.configure(function(){
  app.use(fullBodyParser());
});

var root_url = 'http://localhost:' + port + '/'
var root_path = ''
var router = new Router(app, root_url, __dirname + '/resources', root_path);

var mongo_url = 'mongodb://127.0.0.1:27017/percolator';
console.log('------------------------------------');
console.log('mongo_url: ' + mongo_url);
var db = mongoose.connect(mongo_url)

app.listen(port);
