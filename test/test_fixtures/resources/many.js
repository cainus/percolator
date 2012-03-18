exports.handler = {

  collectionGET : function(q, s){
    s.send({"items" : [{"hello" : "collectors", "links" : '/many/1234'}]});
  },

  GET : function(q, s){
    s.send('1234');
  }




}
