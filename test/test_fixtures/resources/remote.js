exports.handler = {
  GET : function(req, res){
    res.object({})
      .link('templatey', 
            '/intake/{app_id}?hub.challenge={challenge}',
            {method : "GET"})
      .link('google', 'http://google.com')
      .send();
  }
};
