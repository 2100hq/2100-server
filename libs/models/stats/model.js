const lodash = require('lodash')
const assert = require('assert')
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
    emit('change',result)
    return result
  }

  async function get(id) {
    return table.get(id)
  }

  async function create(props) {
    const result = validate(defaults(props))
    if(result.id) assert(!(await table.has(result.id)), 'Stats with that id already exists')
    return set(result)
  }


  return {
    ...table,
    set,
    get,
    create,
  }
}

