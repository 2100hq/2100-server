var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const bn = require('bignumber.js')

module.exports = function(config,table,emit=x=>x) {
  const validate = Validate(Schema(config))
  const defaults = Defaults(config)

  async function set(props) {
    const result = validate(defaults(props))

    //we need additional validation because of string numbers
    assert(bn(result.supply).isInteger(),'Supply amount must be a integer')
    assert(bn(result.reward).isInteger(),'Supply amount must be a integer')
    assert(bn(result.creatorReward).isInteger(),'Supply amount must be a integer')

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

  async function updateOwner(id,userid){
    assert(userid,'requires a user id')
    const token = await get(id)
    token.ownerAddress = userid
    return set(token)
  }

  return {
    ...table,
    set,
    get,
    create,
    updateOwner,
  }
}

