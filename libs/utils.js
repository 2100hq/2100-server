const lodash = require('lodash')
const assert = require('assert')
const pad = require('pad')
const Rethink = require('rethinkdb')


exports.parseError = err => {
  assert(err.message,'error requires message')
  assert(err.stack, 'error requires stack')
  return {
    message:err.message,
    stack:err.stack,
  }
}

exports.blockid = function ID(number){
  return pad(16,number,'0')
}

exports.IncreasingId = (start=0)=>{
  let nonce = start
  return (now=Date.now())=>{
    const id = [now,pad(8,nonce,'0')].join('!')
    nonce++
    return id
  }
}

exports.walletId = function(userid,tokenid){
  assert(userid,'requries user address')
  assert(tokenid,'requires token address')
  return [userid.toLowerCase(),tokenid.toLowerCase()].join('!')
}

//singelton
let rethinkConnection = null
exports.RethinkConnection = async config => {
  assert(config, 'requires rethink config')
  assert(config.db, 'requires rethink.db')
  if (rethinkConnection) return rethinkConnection
  rethinkConnection = await Rethink.connect(config)
  return exports.Rethink.Utils.createDB(rethinkConnection, config.db)
}

exports.Rethink = require('rethink-table')

exports.calculateStakes = (token,stakers)=>{
  const totalStaked = lodash.sumBy(stakers,'value')
  return stakers.map(({address,value})=>{
    return {
      token:token.name,
      to:address,
      value:value/totalStaked * token.reward
    }
  })
}

exports.loop = async (fn, delay = 1000, max, count = 0, result) => {
  assert(lodash.isFunction(fn), 'loop requires a function')
  if (max && count >= max) return result
  result = await fn(count)
  await new Promise(res => setTimeout(res, delay))
  return exports.loop(fn, delay, max, count + 1, result)
}
