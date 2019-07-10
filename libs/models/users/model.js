const lodash = require('lodash')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const assert = require('assert')

module.exports = (config,table,emit) => {
  const defaults = Defaults()
  const validate = Validate(Schema())

  async function create(props) {
    if(props.id) assert(!await table.has(props.id), 'User already exists with this id')
    return set(props)
  }

  async function set(user) {
    user = validate(defaults(user))
    await table.set(user.id,user)
    emit('change',user)
    return user
  }

  async function get(id) {
    const result = await table.get(id)
    assert(result, 'User not found')
    return result
  }

  return {
    ...table,
    create,
    set,
    get,
  }
}

