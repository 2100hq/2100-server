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

  async function set (value) {
    validate(defaults(value))
    value.updated = Date.now()
    await table.set(value.id, value)
    emit('change',value)
    return value
  }

  function create (props) {
    return set(defaults(props))
  }

  async function setState (id, state, props = {}) {
    assert(state, 'requires state')
    const val = await get(id)
    val.state = state
    val.yield = false
    return set({ ...val, ...props })
  }

  async function success (id, resolve, props = {}) {
    const val = await get(id)
    val.state = 'Success'
    val.done = true
    val.yield = false
    val.resolve = resolve
    return set({ ...val, ...props })
  }
  async function failure (id, reject, props = {}) {
    const val = await get(id)
    val.state = 'Failure'
    val.done = true
    val.yield = false
    val.reject = reject
    return set({ ...val, ...props })
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
    async yield(id){
      const cmd = await get(id)
      cmd.yield = true
      return set(cmd)
    }
  }
}
