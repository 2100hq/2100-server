const uuid = require('uuid/v4')
const assert = require('assert')

module.exports = (config,libs) => user =>{

  async function login({username}){
    assert(username,'login requires username')
    assert(username.length,'login requires username of at least length 1')
    try{
      return await libs.users.getByUsername(username)
    }catch(err){
      return libs.users.create({username})
    }
  }

  async function logout(props){
    return props
  }

  return {
    login,
    logout,
  }
}
