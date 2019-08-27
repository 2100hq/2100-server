const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const assert = require('assert')

module.exports = (config, table, emit=x=>x) => {
  const defaults = Defaults(config)
  const validate = Validate(Schema(config))

  async function get (id) {
    assert(id, 'requires transfer id')
    assert(await table.has(id), 'no data for: ' + id)
    return table.get(id)
  }

  async function set (value,previous) {
    validate(defaults(value))
    value.updated = Date.now()
    await table.set(value.id, value)
    //if we provide a previous state, then check that against new state
    // console.log('set state',value.state,previous.state)
    if(previous){
      //only emit change if state changes, this will reduce number of emissions
      if(value.state !== previous.state || value.done !== previous.done) emit('change',value)
    }
    return value
  }

  function create (props) {
    return set(defaults(props),props)
  }

  async function setState (id, state, props = {}) {
    assert(state, 'requires state')
    const val = await get(id)
    const update = {
      state:state,
      yield:false,
    }
    return set({ ...val, ...update, ...props },val)
  }

  async function success (id, resolve, props = {}) {
    const val = await get(id)

    const update = {
      state : 'Success',
      done : true,
      yield : false,
      resolve : resolve,
    }

    return set({ ...val, ...update, ...props },val)
  }
  async function failure (id, reject, props = {}) {
    const val = await get(id)

    const update = {
      state : 'Failure',
      done : true,
      yield : false,
      reject : reject,
    }
    return set({ ...val, ...update, ...props },val)
  }
  
  //hack which allows command to yield to other
  //commands. doesnt really belong here but easiest
  async function yield(id,value=true){
    const cmd = await get(id)
    const update = {
      yield:value
    }
    return set({...cmd,...update},cmd)
  }

  return {
    ...table,
    create,
    get,
    set,
    success,
    failure,
    setState,
    defaults,
    validate,
    yield,
    emit,
  }
}
