var Resource = require('resorcery').resource;

exports.handler = new Resource({

  GET : function(req, res){
    console.log("HERE!!!!!!!!!!!!!!!");
    console.log("pre end");
    console.log(req.url);
    console.log('this: ', this);
    res.end(JSON.stringify(this.uri.help()));
    console.log("post end");
  }


});
