var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')

module.exports = function(config,table,emit=x=>x) {
  const validate = Validate(Schema(config))
  const defaults = Defaults(config)

  async function set(props) {
    const result = validate(defaults(props))
    await table.set(result.id,result)
    emit('set',result)
    return result
  }

  async function get(id) {
    assert(await table.has(id), 'That token does not exist')
    return table.get(id)
  }

  async function create(props) {
    assert(!(await table.has(props.id)), 'token with that ID already exists')
    return set(props)
  }

  async function mint(id,amount){
    assert(amount >0,'Can only mint amount above 0')
    const token = await get(id)
    token.minted += amount
    return set(token)
  }

  return {
    ...table,
    set,
    get,
    create,
    mint,
  }
}

