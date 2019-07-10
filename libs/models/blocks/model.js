var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const {blockid} = require('../../utils')

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
    id = blockid(id)
    assert(await table.has(id), 'That block does not exist')
    return table.get(id)
  }

  async function create(props) {
    const result = validate(defaults(props))
    assert(!(await table.has(result.id)), 'block with that ID already exists')
    return set(result)
  }


  return {
    ...table,
    set,
    get,
    create,
  }
}

