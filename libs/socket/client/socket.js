const io = require('socket.io-client')
const assert = require('assert')
module.exports = async (host,emit=x=>x) => {
  assert(host,'requires socket host address')
  const socket = io(host)

  const events = ['connect','error','connect_error','connect_timeout','reconnect','reconnect_error','reconnect_failed']
  events.forEach(name=>{
    socket.on(name,(...args)=>emit(name,...args))
  })

  await new Promise((res,rej)=>{
    socket.once('connect',res)
    socket.once('error',rej)
    socket.once('disconnect',rej)
    socket.once('connect_error',rej)
    socket.once('connect_timeout',rej)
  })

  return (channel,cb) => {

    if(cb){ 
      socket.on(channel,cb)
    }

    function call(action,...args){
      return new Promise((res,rej)=>{
        socket.emit(channel,action,args,(err,result)=>{
          if(err) return rej(new Error(err.message || err))
          res(result)
        })
      })
    }


    function listen(cb){
      socket.on(channel,cb)
    }

    return {
      call,listen,socket
    }
  }
}
