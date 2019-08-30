var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const {eventid} = require('../../utils')

module.exports = function(config,table,emit=x=>x) {
  const validate = Validate(Schema(config))
  const defaults = Defaults(config)

  async function set(props) {
    const result = validate(defaults(props))
    await table.set(result.id,result)
    emit('set',result)
    return result
  }

  async function getBy(address,block,index){
    const id = eventid(block,index,address)
    assert(await table.has(id), 'That event does not exist')
    return table.get(id)
  }
  async function get(id) {
    assert(await table.has(id), 'That event does not exist: ' + id)
    return table.get(id)
  }

  async function create(props) {
    const result = validate(defaults(props))
    if(result.id) assert(!(await table.has(result.id)), 'Event with that ID already exists: ' + result.id)
    return set(result)
  }

  function format(props){
    return validate(defaults(props))
  }

  async function setDone(id){
    console.log('setting done',id)
    const result = await get(id)
    result.done = true
    return set(result)
  }


  return {
    ...table,
    set,
    get,
    getBy,
    create,
    format,
    setDone,
  }
}

