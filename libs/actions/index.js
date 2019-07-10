// const Actions = {
//   Public:require('./public'),
//   Private:require('./private'),
//   Auth:require('./auth'),
//   Admin:require('./admin'),
// }

const assert = require('assert')
module.exports = (name, config, libs)=>{
  const actions = require('./' + name)(config,libs)
  assert(actions,'actions not found: ' + name)
  return async (user,action,...args)=>{
    const scope = actions(user)
    assert(scope[action],'No such action ' + action + ' in ' + name)
    console.time([name,action].join(' '))
    const result = await scope[action](...args)
    console.timeEnd([name,action].join(' '))
    return result
  }
}
