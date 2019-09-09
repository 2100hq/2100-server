const lodash = require('lodash')
const Promise = require('bluebird')
const highland = require('highland')
const assert = require('assert')
const Commands = require('./command-stream')

module.exports = (config,{handlers,commands})=>{
  const streams = new Map()
  const stream = new highland()

  function getOrCreateStream(id){
    // console.log('getting stream',id)
    if(streams.has(id)) return streams.get(id)
    const stream = Commands({name:id,...config},{handlers,commands})
    streams.set(id,stream)
    return stream
  }

  const tail = stream.map(cmd=>{
    // console.log('processing',cmd.type,cmd.id)
    switch(cmd.type){
      //these 2 commands touch dai wallets
      case 'pendingDeposit':
      case 'withdrawPrimary':
      //needs read/writes to staking and dai wallet per token
      case 'rebalanceStakes':
      case 'setAbsoluteStakes':{
        const stream = getOrCreateStream('primaryToken')
        stream.write(cmd)
        break
      }
      //this can be its own stream, but not 
      //a lot of events, we will just add to sparse stream
      case 'createPendingToken':
      case 'createActiveToken':
      case 'createTokenByTweet':
      case 'createTokenByName':{
        const stream = getOrCreateStream('slow')
        stream.write(cmd)
        break
      }
      //here we can split off queues per token
      case 'generateStakeRewards':
      case 'transferOwnerReward': 
      case 'transferStakeReward': 
      case 'deposit': 
      case 'transferCreatorReward': {
        const stream = getOrCreateStream(cmd.tokenid)
        stream.write(cmd)
        break
      }
      default:
        throw new Error('Unhandled command type: ' + cmd.type)
    }
  })
  .errors(err=>{
    console.log('parallel error',err)
    process.exit(1)
  })

  return {
    write(cmd){
      stream.write(cmd)
    },
    resume(){
      tail.resume()
    }
  }

}

