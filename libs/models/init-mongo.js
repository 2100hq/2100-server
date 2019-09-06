const Wallets = require('./wallets')
const Tokens = require('./tokens')
const Transactions = require('./transactions')
const Users = require('./users')
const Cache = require('./cache')
const Commands = require('./commands')
const Stateful = require('./stateful')
const Blocks = require('./blocks')
const Events = require('./eventlogs')
const Coupons = require('./coupons')
const Visited = require('./visited')
const Stats = require('./stats')

//con is a mongo db
module.exports = async (config={},{con},emit)=>{

  const models = {
    wallets:{
      available:Wallets.Model({},
        Commands.Cache(config, await Wallets.Mongo({table:'available'},con)),
        // await Wallets.Mongo({table:'available'},con),
        (...args)=>emit('wallets.available',...args)),
      locked:Wallets.Model({},
        Commands.Cache(config, await Wallets.Mongo({table:'locked'},con)),
        // await Wallets.Mongo({table:'locked'},con),
        (...args)=>emit('wallets.locked',...args)),
      //this is not an mistype, stakes are an instance of wallets
      stakes:Wallets.Model({},
        Commands.Cache(config, await Wallets.Mongo({table:'stakes'},con)),
        // await Wallets.Mongo({table:'stakes'},con),
        (...args)=>emit('wallets.stakes',...args)),
    },
    //all tokens we knwo of
    //tokens are now stateful, they are pending, active, disabled
    tokens:{
      active:Tokens.Model(
        config.tokens,
        await Tokens.Mongo({table:'active_tokens'},con),
        (...args)=>emit('tokens.active',...args)
      ),
      pending:Tokens.Model(
        {...config.tokens,type:'Pending'},
        await Tokens.Mongo({table:'pending_tokens'},con),
        (...args)=>emit('tokens.pending',...args)
      ),          
      disabled:Tokens.Model(
        config.tokens,
        await Tokens.Mongo({table:'disabled_tokens'},con),
        (...args)=>emit('tokens.disabled',...args)
      )          
    },
    commands:Commands.Model(config, 
      Stateful.Model(config,
        await Commands.Mongo({table:'commands'},con),
        (...args)=>emit('commands',...args)
      )
    ),
    blocks:Blocks.Model({},await Blocks.Mongo({table:'blocks'},con),(...args)=>emit('blocks',...args)),
    eventlogs:Events.Model({},
      await Events.Mongo({table:'events'},con),
      (...args)=>emit('eventlogs',...args)
    ),
    // visited:Visited.Model(config,await Visited.Mongo({table:'visited'},con),(...args)=>emit('visited',...args)),
    users:Users.Model({},await Users.Mongo({table:'users'},con),(...args)=>emit('users',...args)),
    //these are signed receipts for users to submit on chain
    coupons:{
      create:Coupons.Model({},await Coupons.Mongo({table:'create_coupons'},con),(...args)=>emit('coupons.create',...args)),
      mint:Coupons.Model({},await Coupons.Mongo({table:'mint_coupons'},con),(...args)=>emit('coupons.mint',...args)),
    },
    stats:{
      stakes:{
        latest:Stats.Model(config,Cache(),(...args)=>emit('stats.stakes.latest',...args)) ,
        history:Stats.Model(config,await Stats.Mongo({table:'stats_stakes_history'},con),(...args)=>emit('stats.stakes.history',...args)) 
      },
      earned:{
        latest:Stats.Model(config,Cache(),(...args)=>emit('stats.earned.latest',...args)) ,
      },
      global:{
        latest:Stats.Model(config,Cache(),(...args)=>emit('stats.global.latest',...args)) ,
        history:Stats.Model(config,await Stats.Mongo({table:'stats_global_history'},con),(...args)=>emit('stats.global.history',...args)) 
      },
    }
  }

  return models
}

