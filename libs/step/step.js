const assert = require('assert')
module.exports = (config,handlers={})=>{
  return async (stateful)=> {
    const handler = handlers[stateful.type]
    console.log('stepping',stateful.type,stateful.state)
    assert(handler,'No handler for stateful type: ' + stateful.type)
    assert(handler[stateful.state],'No handler for unknown state: ' + stateful.state)
    await handler[stateful.state](stateful)
    return stateful
  }
}
