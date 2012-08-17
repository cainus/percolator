exports.handler = {

  collectionGET : function(q, s){
    s.repr({"items" : [{"hello" : "collectors", "links" : '/many/1234'}]});
  },

  GET : function(q, s){
    s.end('1234');
  }




};
