
exports.fromString = function (str){
  return JSON.parse(str);
};

exports.toString = function(obj){
  return JSON.stringify(obj);
};

