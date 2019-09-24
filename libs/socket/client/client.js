const Socket = require('./socket')
const State = require('./state')
module.exports = async ({channels=[],host},state={},emit=x=>x)=>{
  const setState = State(state,emit)
  const socket = await Socket(host,console.log)

  return channels.reduce((result,channel)=>{
    console.log('joining',channel)
    result[channel] = socket(channel,events=>events.forEach(setState(channel)))
    return result
  },{})

}

