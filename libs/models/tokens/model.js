var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const PendingDefaults = require('./pendingDefaults')
const Schema = require('./schema')
const PendingSchema = require('./pendingSchema')
const Validate = require('../validate')
const bn = require('bignumber.js')

module.exports = function(config,table,emit=x=>x) {
  //ok this is hacky, but i decided to hold pending tokens
  //and active tokens in different tables, because specifically of
  //id requirements. for pending, we only have name to go on. for active
  //we use contract id. 
  const {type='Active'} = config

  let validate = Validate(Schema(config))
  let defaults = Defaults(config)

  //pending tokens only need an id and name so we have different
  //validation and defaults from teh rest (active,disabled)
  if(type === 'Pending'){
    validate = Validate(PendingSchema(config))
    defaults = PendingDefaults(config)
  }

  async function set(props) {
    const result = validate(defaults(props))

    if(type !== 'Pending'){
      //we need additional validation because of string numbers
      assert(bn(result.supply).isInteger(),'Supply amount must be a integer')
      assert(bn(result.reward).isInteger(),'Supply amount must be a integer')
      assert(bn(result.creatorReward).isInteger(),'Supply amount must be a integer')
    }

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

