let Account = require('../models/account')

class authentication{
    authet(req,res,next){
        if(req.cookies.userId){
            next()
        }
        else{
            res.redirect('/login')
        }
    }
   async getUserAndAvt(req,res,next){
         if(req.cookies.userId){
        await  Account.findById({_id:req.cookies.userId})
            .then((user)=>{
                res.locals.avatar = user.avatar
                res.locals.userName = user.userName
            })
        }
        next()
    }
}
module.exports = new authentication     