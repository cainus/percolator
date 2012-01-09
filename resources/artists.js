const _ = require('../underscore-min');

var collection = {
  "1" : { name: "Jimi Hendrix",
                created_at: new Date(),
                links: {
                  self: { href: "/artists/1" },
                  parent: { href: "/artists" }
              }},

  "2" : { name: "Bob Dylan",
                created_at: new Date(),
                links: {
                  self: { href: "/artists/2" },
                  parent: { href: "/artists" }
              }}


}


exports.GET = function(req, res){
  res.send(collection[req.param("id")]);
}

exports.collectionGET = function(req, res){

  var items = _.map(collection, function(v, k){
    return(v);
  });
  var artistCollection = { items: items,
                         links: {
                           self: { href: "/artists" },
                           parent: { href: "/" }
                        }};
  res.send(artistCollection);
}