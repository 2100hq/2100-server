// const Actions = {
//   Public:require('./public'),
//   Private:require('./private'),
//   Auth:require('./auth'),
//   Admin:require('./admin'),
// }

const assert = require('assert')
const lodash = require('lodash')
module.exports = (name, config, libs,emit)=>{
  const actions = require('./' + name)(config,libs,emit)
  assert(actions,'actions not found: ' + name)
  return async (user,action,...args)=>{
    const scope = actions(user)
    assert(scope[action],'No such action ' + action + ' in ' + name)
    const id = lodash.uniqueId(['actions',name,action,''].join('.'))
    console.time(id)
    const result = await scope[action](...args).catch(err=>{
      console.timeEnd(id)
      if(config.debug){
        console.error(id,err.stack)
        console.error(...args)
      }
      throw err
    })
    console.timeEnd(id)
    return result
  }
}
