var _ = require('underscore');
var ET = require('elementtree');

exports["in"] = function(str){
  return str;
};


exports.out = function(obj){
  var rootKeys = _.keys(obj);
  var root;
  var subobj;
  try {
    if (rootKeys.length > 1){
      root = new ET.Element('root');
      subobj = obj;
    } else {
      root = ET.Element(rootKeys[0]);
      subobj = obj[rootKeys[0]];
    }
  } catch(ex){
    console.log(ex);
  }

  _.each(subobj, function(v, k){
    var body = ET.SubElement(root, k);
    body.text = JSON.stringify(v);
  });

  console.log(ET.tostring(root));
  return ET.tostring(root);
};
