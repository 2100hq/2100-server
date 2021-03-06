const assert = require('assert')
const lodash = require('lodash')

//converts table events into socket events
module.exports = (config,libs,emit)=>{

  function privateEvent([table,method,data]){
    // if(table.includes('wallets')){
    //   const [,token] = table.split('_')
    //   if(method == 'change'){
    //     data.token = token
    //     return emit('private',data.id,['myWallets',token],data)
    //   }
    //   // if(method === 'created'){
    //   //   return emit('private',data.id,[token],data)
    //   // }
    // }
    // console.log(table,method,data)
    switch(table){
      case 'commands':{
        // if(data.type == 'transferStakeReward') return
        // if(data.type == 'transferOwnerReward') return
        if(data.done){
          emit('private',data.userid,['myCommandHistory',data.id],data)
        }
        return emit('private',data.userid,['myCommands',data.id],data)
      }
      //internal/locked wallets
      case 'wallets.available':{
        return emit('private',data.userid,['myWallets','available',data.tokenid],data)
      }
      case 'wallets.locked':{
        return emit('private',data.userid,['myWallets','locked',data.tokenid],data)
      }
      case 'wallets.stakes':{
        return emit('private',data.userid,['myStakes',data.tokenid],data.balance)
      }
      case 'coupons.mint':{
        return emit('private',data.userid,['myCoupons','mint',data.id],data)
      }
      case 'tokens.active':{
        return emit('private',data.ownerAddress,['myTokens',data.id],data)
      }
      // case 'stakes':{
      //   console.log('private event',table,method,data)
      //   lodash.forEach(data.stakers,(amount,userid)=>{
      //     return emit('private',userid,['myStakes',data.id],data)
      //   })
      // }
      case 'users':{
        return emit('private',data.id,['me'],data)
      }
    }
  }

  async function publicEvent([table,method,data]){
    if(table == 'commands'){
      if(!data.done) return
      if(data.type != 'generateStakeRewards') return
      // console.log('publishing stats',await libs.query.getEarnedBlockStats(data.blockNumber,data.tokenid))
      emit('stats',['earned','block',data.tokenid], await libs.query.getEarnedBlockStats(data.blockNumber,data.tokenid))
    }
    if(table == 'stats.global.latest'){
      emit('stats',['global','latest',],data.stats)
    }
    if(table == 'stats.stakes.latest'){
      // console.log('stats.stakes.latest',table,method,data)
      emit('public',['stakes',data.id],data.stats)
    }
    if(table == 'stats.earned.latest'){
      // console.log('stats.earned.latest',table,method,data)
      emit('stats',['earned','latest',data.id],data.stats)
    }
    if(table.includes('wallets')){
      return 
    }
    if(table == 'users') return 
    if(table == 'transactions') return 
    if(table == 'blocks'){
      emit('public',['latestBlock'],data)
    }
    if(table === 'tokens.pending'){
      emit('public',['tokens','pending',data.id],data)
    }
    if(table === 'tokens.active'){
      emit('public',['tokens','active',data.id],data)
    }
    if(table === 'tokens.disabled'){
      emit('public',['tokens','disabled',data.id],data)
    }
    if(table === 'coupons.create'){
      return emit('public',['coupons','create',data.id],data)
    }
    // if(table === 'usercount'){
    //   return emit('public',['usercount'],data)
    // }
    // emit('public',[table,data.id],data)
  }
  

  return {
    write(args){
      try{
        privateEvent(args)
        publicEvent(args)
      }catch(err){
        console.log('events error',err)
        emit('error',err)
      }
    }
  }

}
