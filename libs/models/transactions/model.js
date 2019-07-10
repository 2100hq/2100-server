var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const {parseError} = require('../../utils')

module.exports = function(config,table,emit=x=>x) {
  const validate = Validate(Schema(config))
  const defaults = Defaults(config)

  const types = [
    'mint','requestWithdraw','confirmWithdraw','cancelWithdraw',
    'requestDeposit','confirmDeposit','transfer','stake',
    'unstake','generate','destroy'
  ]

  async function set(props) {
    props = defaults(props)
    props.updated = Date.now()
    const result = validate(props)
    await table.set(result.id,result)
    emit('set',result)
    return result
  }

  async function get(id) {
    assert(await table.has(id), 'That Transaction does not exist')
    return table.get(id)
  }

  async function create(props) {
    props = defaults(props)
    assert(!(await table.has(props.id)), 'transaction already exists')
    return set(props)
  }

  async function remove(props={}){
    assert(props.id,'requires id to remove')
    await table.delete(props.id)
    return props
  }

  async function createWithError(props,err){
    props.error = parseError(err)
    return create(props)
  }


  return {
    ...table,
    set,
    get,
    create,
    createWithError,
    remove,
    //dynamic types of transactions
    ...types.reduce((result,type)=>{
      result[type] = props => {
        return create({
          ...props,
          type,
        })
      }
      return result
    },{})
  }
}

