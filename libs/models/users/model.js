const lodash = require('lodash')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const assert = require('assert')

module.exports = (config,table,emit=x=>x) => {
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

  async function getOrCreate(id){
    try{
      return await get(id)
    }catch(err){
      return create({id})
    }
  }

  async function setAdmin(id,isAdmin=true){
    const user = await get(id)
    user.isAdmin = isAdmin
    return set(user)
  }

  async function setFavorite(id,address,favorite=true){
    assert(id,'requires user id')
    assert(address,'requires token address')
    const user = await get(id)
    let favorites = user.favorites || []
    if(favorite){
      favorites = lodash.uniq([address,...favorites])
    }else{
      favorites = favorites.filter(x=>x!==address)
    }
    user.favorites = favorites
    return set(user)
  }

  return {
    ...table,
    create,
    set,
    get,
    getOrCreate,
    setAdmin,
    setFavorite,
  }
}

