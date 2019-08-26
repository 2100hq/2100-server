const io = require('socket.io-client')
const assert = require('assert')
module.exports = async host => {
  assert(host,'requires socket host address')
  const socket = io(host)

  await new Promise((res,rej)=>{
    socket.once('connect',res)
    socket.once('error',rej)
    socket.once('disconnect',rej)
    socket.once('connect_error',rej)
    socket.once('connect_timeout',rej)
  })

  return (channel,cb) => {
    if(cb) socket.on(channel,cb)
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

