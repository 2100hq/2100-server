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
        return emit('private',data.userid,['myCommands',data.id],data)
      }
      //internal/locked wallets
      case 'available':{
        return emit('private',data.userid,['myWallets','available',data.tokenid],data)
      }
      case 'locked':{
        return emit('private',data.userid,['myWallets','locked',data.tokenid],data)
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

  function publicEvent([table,method,data]){
    if(table.includes('wallets')){
      return 
    }
    if(table == 'users') return 
    if(table == 'transactions') return 
    if(table == 'blocks'){
      emit('public',['latestBlock'],data)
    }
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
