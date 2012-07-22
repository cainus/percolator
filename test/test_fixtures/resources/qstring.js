var resource = require('resorcery').resource;

exports.handler = new resource({

  GET : function(req, res){
    console.log("HERE!!!!!!!!!!!!!!!");
    console.log("pre end");
    console.log(req);
    console.log(req.params);
    console.log(req.param('qstring', 'default val'));
    res.end('this worked' + req.query.qstring);// + req.params('qstring!'));
    console.log("post end");
  }


});
