const assert = require('assert')
const lodash = require('lodash')

//converts table events into socket events
module.exports = (config,libs,emit)=>{

  function privateEvent([table,method,data]){
    if(table.includes('wallets')){
      const [,token] = table.split('_')
      if(method == 'change'){
        data.token = token
        return emit('private',data.id,['myWallets',token],data)
      }
      // if(method === 'created'){
      //   return emit('private',data.id,[token],data)
      // }
    }
    switch(table){
      case 'stakes':{
        console.log('private event',table,method,data)
        lodash.forEach(data.stakers,(amount,userid)=>{
          return emit('private',userid,['myStakes',data.id],data)
        })
      }
      case 'users':{
        return emit('private',data.id,['me'],data)
      }
    }
  }

  function publicEvent([table,method,data]){
    if(table.includes('wallets')){
      return 
      // const [,token] = table.split('.')
      // if(method == 'created'){
      //   data.token = token
      //   return emit('public',['wallets',token],data)
      // }
    }
    if(table == 'users') return 
    if(table == 'transactions') return 
    if(table == 'blocks'){
      emit('public',['latestBlock'],data)
    }
    emit('public',[table,data.id],data)
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
