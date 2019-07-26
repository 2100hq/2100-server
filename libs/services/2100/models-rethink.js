const Wallets = require('../../models/wallets')
const Tokens = require('../../models/tokens')
const Transactions = require('../../models/transactions')
const Users = require('../../models/users')
const Cache = require('../../models/cache')
const Commands = require('../../models/commands')
const Stateful = require('../../models/stateful')
const Blocks = require('../../models/blocks')
const Events = require('../../models/eventlogs')
const Coupons = require('../../models/coupons')

//please ignore absurdity of this code, but its just a helper to essentially wire
//stores with models and listen for events
module.exports = async (config={},{con},emit)=>{

  const models = {
    wallets:{
      available:Wallets.Model({},await Wallets.Rethink({table:'available'},con),(...args)=>emit('available',...args)),
      locked:Wallets.Model({},await Wallets.Rethink({table:'locked'},con),(...args)=>emit('locked',...args)),
      //this is not an mistype, stakes are an instance of wallets
      stakes:Wallets.Model({},await Wallets.Rethink({table:'stakes'},con),(...args)=>emit('stakes',...args)),
    },
    //all tokens we knwo of
    //tokens are now stateful, they are pending, confirmed, disabled
    tokens:Tokens.Model(config.tokens,
      Stateful.Model(config,await Tokens.Rethink({table:'tokens'},con),
        (...args)=>emit('tokens',...args)
      )
    ),
    commands:Commands.Model(config, 
      Stateful.Model(config,
        await Commands.Rethink({table:'commands'},con),
        (...args)=>emit('commands',...args)
      )
    ),
    blocks:Blocks.Model({},await Blocks.Rethink({table:'blocks'},con),(...args)=>emit('blocks',...args)),
    eventlogs:Events.Model({},await Events.Rethink({table:'events'},con),(...args)=>emit('eventlogs',...args)),
    //transactions:{
    //  success:Transactions.Model({},await Transactions.Rethink({table:'transactions'},con),(...args)=>emit('success',...args)),
    //  //pending and failures do not get persisted
    //  pending:Transactions.Model({},Cache(),(...args)=>emit('pending',...args)),
    //  failure:Transactions.Model({},Cache(),(...args)=>emit('failure',...args)),
    //},
    users:Users.Model({},await Users.Rethink({table:'users'},con),(...args)=>emit('users',...args)),
    //these are signed receipts for users to submit on chain
    coupons:{
      create:Coupons.Model({},await Coupons.Rethink({table:'create_coupons'},con),(...args)=>emit('create_coupons',...args)),
      withdraw:Coupons.Model({},await Coupons.Rethink({table:'withdraw_coupons'},con),(...args)=>emit('withdraw_coupons',...args)),
    }
  }

  return models
}
