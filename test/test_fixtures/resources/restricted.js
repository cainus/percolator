
exports.handler = {

  basicAuthenticate : function(login, pass, req, res, cb){
    if (login === "login" && pass === "password"){
      cb(null, true);
    } else {
      cb(true);
    }
  },

  GET : function(req, res){
    res.object({accessGranted:true}).send();
  }

};
