const express = require('express');
const mongoose = require('mongoose');
const fullBodyParser = require('./fullBodyParser');
const jsonBodyParser = require('./jsonBodyParser');
const Router = require('./Router').Router;


var app = express.createServer();
app.configure(function(){
  app.use(fullBodyParser());
  app.use(jsonBodyParser());
});

var port = process.env.PORT || 3000;
var portStr = ':' + port + '';
if (port == 80){portstr = '';}
app.set('base_path', 'http://localhost' + portStr);


var router = new Router(app, '/', __dirname + '/resources', '');

var mongo_url = 'mongodb://127.0.0.1:27017/percolator';
console.log('------------------------------------');
console.log('mongo_url: ' + mongo_url);
var db = mongoose.connect(mongo_url)

app.listen(port);
