const Wallets = require('../../models/wallets')
const Tokens = require('../../models/tokens')
const Transactions = require('../../models/transactions')
const Cache = require('../../models/cache')
const Users = require('../../models/users')
const Commands = require('../../models/commands')
const Stateful = require('../../models/stateful')
const Blocks = require('../../models/blocks')
const Events = require('../../models/eventlogs')
const Coupons = require('../../models/coupons')

module.exports = async (config={},libs,emit=x=>x) => {

  return {
    wallets:{
      available:Wallets.Model({},Cache(),(...args)=>emit('wallets.available',...args)),
      // external:Wallets.Model({},Cache(),(...args)=>emit('external',...args)),
      locked:Wallets.Model({},Cache(),(...args)=>emit('wallets.locked',...args)),
      //this is not an mistype, stakes are an instance of wallets
      stakes:Wallets.Model({},Cache(),(...args)=>emit('wallets.stakes',...args)),
    },
    //all tokens we knwo of
    tokens:{
      active:Tokens.Model(
        config.tokens,
        Cache(),
        (...args)=>emit('tokens.active',...args)
      ),
      pending:Tokens.Model(
        {...config.tokens,type:'Pending'},
        Cache(),
        (...args)=>emit('tokens.pending',...args)
      ),          
      disabled:Tokens.Model(
        config.tokens,
        Cache(),
        (...args)=>emit('tokens.disabled',...args)
      )          
    },
    commands:Commands.Model(config, 
      Stateful.Model(config,
        Cache(),
        (...args)=>emit('commands',...args)
      )
    ),
    blocks:Blocks.Model({},Cache(),(...args)=>emit('blocks',...args)),
    eventlogs:Events.Model({},Cache(),(...args)=>emit('eventlogs',...args)),
    users:Users.Model({},Cache(),(...args)=>emit('users',...args)),
    coupons:{
      create:Coupons.Model({},Cache(),(...args)=>emit('coupons.create',...args)),
      withdraw:Coupons.Model({},Cache(),(...args)=>emit('coupons.withdraw',...args)),
    }
  }
}

