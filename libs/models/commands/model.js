const assert = require('assert')
const lodash = require('lodash')

const Defaults = require('./defaults')
const Schema = require('./schema')
const Types = require('./types')
const Validate = require('../validate')

module.exports = (config,stateful,emit=x=>x) =>{
  const defaults = Defaults(config)
  const validate = Validate(Schema(config))


  async function create(props){
    if(props.id) assert(!(await stateful.has(props.id)),'Cannot create command that already exists with id')
    return stateful.create(validate(defaults(props)))
  }

  //looksup the command type for schema and defaults
  //not the fastest implementation but easist to  add/remove
  //new types
  function createType(type,props){
    return create(format(type,props))
  }

  function format(type,props){
    assert(type,'requires command type')
    const Type = Types(type)
    const d = Type.Defaults(config)
    const v = Validate(Type.Schema(config))
    return validate(defaults(v(d({...props,type}))))
  }

  async function createAll(many=[]){
    await stateful.insert(many)
    many.forEach(x=>stateful.emit('change',x))
    return many
  }

  return {
    ...stateful,
    create,
    format,
    createType,
    createAll,
  }
}

