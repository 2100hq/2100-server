const lodash = require('lodash')
const assert = require('assert')
module.exports = (config,channel,actions)=>{
  return (socket,next)=>{
    socket.on(channel,(action,args,cb=x=>x)=>{
      actions(socket,action,...args).then(result=>{
        cb(null, result)
      }).catch(err=>{
        if(config.debug) console.log(channel, action, args,err)
        if (cb) cb(err.message)
      })
    })
    next()
  }
}
