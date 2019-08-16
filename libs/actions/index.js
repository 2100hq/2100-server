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
    const id = lodash.uniqueId([name,action,''].join(' '))
    console.time(id)
    const result = await scope[action](...args)
    console.timeEnd(id)
    return result
  }
}
