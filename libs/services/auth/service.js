const assert = require('assert')
const lodash = require('lodash')
const Emitter = require('events')
const Socket = require('./socket')

const uuid = require('uuid/v4')

module.exports = async (config)=>{

  const emitter = new Emitter()
  const tokens = new Map()

  // function authenticate(tokenid, signed, publicAddress){
  //   publicAddress = publicAddress.toLowerCase()
  //   assert(tokens.has(tokenid),'Invalid Token')
  //   assert(ethers.utils.verifyMessage(tokenid,signed).toLowerCase() === publicAddress,'Invalid signature')
  //   tokens.set(tokenid,publicAddress)
  //   return tokenid
  // }

  function token(){
    const tokenid = uuid()
    tokens.set(tokenid,null)
    return tokenid
  }

  function validate(tokenid){
    assert(tokenid,'requires tokenid')
    assert(tokens.has(tokenid),'invalid token')
    return tokenid
  }

  function login(tokenid,userid){
    validate(tokenid)
    assert(userid,'requires userid')
    tokens.set(tokenid,userid)
    return tokenid
  }
  function logout(tokenid){
    validate(tokenid)
    tokens.delete(tokenid)
    return tokenid
  }
  function user(tokenid){
    validate(tokenid)
    return tokens.get(tokenid)
  }

  function Actions(config,methods){
    return async (method,...args)=>{
      assert(lodash.has(methods,method),'No such method: ' + method)
      return methods[method](...args)
    }
  }
  const actions = await Actions(config,{ validate, token, login, logout, user, })
  const socket = await Socket(config.auth,actions)

  return {
    socket,
    actions,
  }

}
