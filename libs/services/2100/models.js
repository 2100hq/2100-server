const Wallets = require('../../models/wallets')
const Tokens = require('../../models/tokens')
const Transactions = require('../../models/transactions')
const Cache = require('../../models/cache')

module.exports = async (config,{con},emit=x=>x)=>{
  assert(con,'requires rethink connection')

  return {
    wallets:{
      internal:Wallets.Model({},await Wallets.Rethink({table:'internal'},con),(...args)=>emit('internal',...args)),
      external:Wallets.Model({},await Wallets.Rethink({table:'external'},con),(...args)=>emit('external',...args)),
      locked:Wallets.Model({},await Wallets.Rethink({table:'locked'},con),(...args)=>emit('locked',...args)),
      //this is not an mistype, stakes are an instance of wallets
      stakes:Wallets.Model({},await Wallets.Rethink({table:'stakes'},con),(...args)=>emit('stakes',...args)),
    },
    //all tokens we knwo of
    tokens:Tokens.Model({},await Tokens.Rethink({table:'tokens'},con),(...args)=>emit('tokens',...args)),
    transactions:{
      success:Transactions.Model({},await Transactions.Rethink({table:'transactions'},con),(...args)=>emit('success',...args)
      //pending and failures do not get persisted
      pending:Transactions.Model({},Cache(),(...args)=>emit('pending',...args)),
      failure:Transactions.Model({},Cache(),(...args)=>emit('failure',...args)),
    },
    users:Users.Model({},await Users.Rethink({table:'users'},con),(...args)=>emit('users',...args))
  }
}
