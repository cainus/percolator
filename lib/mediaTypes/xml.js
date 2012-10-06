
var _ = require('underscore');
var ET = require('elementtree');

exports.in = function(str){
  return str;
}


exports.out = function(obj){
  console.log("xml out");
  var rootKeys = _.keys(obj);
  console.log("xml out");
  try {
    if (rootKeys.length > 1){
      var root = new ET.Element('root');
      var subobj = obj;
    } else {
      var root = ET.Element(rootKeys[0]);
      var subobj = obj[rootKeys[0]];
    }
  } catch(ex){
    console.log(ex);
  }

  _.each(subobj, function(v, k){
    var body = ET.SubElement(root, k)
    body.text = JSON.stringify(v);
  });

  console.log("xml out");
  console.log(ET.tostring(root));
  return ET.tostring(root);
}
