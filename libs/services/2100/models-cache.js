const Wallets = require('../../models/wallets')
const Tokens = require('../../models/tokens')
const Transactions = require('../../models/transactions')
const Cache = require('../../models/cache')
const Users = require('../../models/users')

module.exports = async (config,{},emit=x=>x)=>{

  return {
    wallets:{
      internal:Wallets.Model({},Cache(),(...args)=>emit('internal',...args)),
      external:Wallets.Model({},Cache(),(...args)=>emit('external',...args)),
      locked:Wallets.Model({},Cache(),(...args)=>emit('locked',...args)),
      //this is not an mistype, stakes are an instance of wallets
      stakes:Wallets.Model({},Cache(),(...args)=>emit('stakes',...args)),
    },
    //all tokens we knwo of
    tokens:Tokens.Model({},Cache(),(...args)=>emit('tokens',...args)),
    transactions:{
      success:Transactions.Model({},Cache(),(...args)=>emit('success',...args)),
      //pending and failures do not get persisted
      pending:Transactions.Model({},Cache(),(...args)=>emit('pending',...args)),
      failure:Transactions.Model({},Cache(),(...args)=>emit('failure',...args)),
    },
    users:Users.Model({},Cache(),(...args)=>emit('users',...args))
  }
}

