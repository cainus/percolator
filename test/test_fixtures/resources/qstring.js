exports.handler = {

  GET : function(req, res){
    res.end(JSON.stringify(req.uri.query()));
  }


};
