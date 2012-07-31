var resource = require('resorcery').resource;

exports.handler = {

  GET : function(req, res){
    console.log("HERE!!!!!!!!!!!!!!!");
    console.log("pre end");
    res.end(JSON.stringify(this.uri.query()));
    console.log("post end");
  }


};
