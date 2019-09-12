const lodash = require('lodash')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const assert = require('assert')

module.exports = (config,table,emit=x=>x) => {
  const defaults = Defaults()
  const validate = Validate(Schema())

  async function create(props) {
    if(props.id) assert(!await table.has(props.id), 'Visited exists')
    return set(props)
  }

  async function set(props) {
    props = validate(defaults(props))
    await table.set(props.id,props)
    emit('change',props)
    return props
  }

  async function createAll(many=[]){
    many = many.map(item=>validate(defaults(item)))
    await table.insert(many)
    many.forEach(x=>emit('change',x))
    return many
  }

  // async function getOrCreate(id,visited){
  //   if(await table.has(id)){
  //     return table.get(id)
  //   }else{
  //     return create({
  //       id,visited
  //     })
  //   }
  // }

  // async function mark(id,visited=true){
  //   return getOrCreate(id,visited)
  // }

  return {
    ...table,
    create,
    createAll,
    set,
  }
}


