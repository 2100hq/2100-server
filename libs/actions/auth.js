const uuid = require('uuid/v4')
const assert = require('assert')

//all other actions pass user in where session is, but
//this is a special case where we need to update the session
//object, which in this case is the users socket session
//consider this not great practice, but its fairly simple
module.exports = (config,{auth,ethers,users},emit=x=>x) => socket =>{

  if(!config.disableAuth) assert(auth,'requires auth client library')
  assert(ethers,'requires ethers')
  assert(socket,'requiers socket')

  function isValidSignature(unsigned,signed,publicAddress,prefix='2100 Login: '){
    assert(unsigned,'requires unsigned token')
    assert(signed,'requires signed token')
    assert(publicAddress,'requires public address')
    return ethers.utils.verifyMessage(prefix+token,signed).toLowerCase() === publicAddress
  }

  function fakeLogin(_,publicAddress){
      //update socket userid
      publicAddress = publicAddress.toLowerCase()
      socket.userid = publicAddress
      emit('login',socket.id,publicAddress)
      //get or create the user
      return users.getOrCreate(publicAddress)
  }

  async function login(signed,publicAddress,tokenid=socket.tokenid){
    assert(auth,'auth server not enabled')
    assert(!socket.userid, 'you are already logged in')
    assert(publicAddress,'requires publicAddress')
    assert(tokenid,'requires a token')
    assert(signed,'requires signed token')
    //verify its a good token before anything
    await auth.call('validate',tokenid)

    //validate signature with address (userid)
    publicAddress = publicAddress.toLowerCase()
    await isValidSignature(tokenid,signed,publicAddress)

    //tell auth server user logged in
    await auth.call('login',tokenid,publicAddress)

    //do socket things on login
    //update socket userid
    socket.userid = publicAddress
    //get or create the user
    await users.getOrCreate(publicAddress)
    emit('login',socket.id,publicAddress)
    return tokenid
  }

  async function user(tokenid){
    assert(auth,'auth server not enabled')
    return auth.call('user',tokenid)
  }

  async function validate(tokenid=socket.tokenid){
    assert(auth,'auth server not enabled')
    await auth.call('validate',tokenid)
    //set this to your session
    socket.tokenid = tokenid
    socket.userid = await auth.call('user',tokenid) 
    if(socket.userid) emit('login',socket.id,socket.userid)
    return tokenid
  }

  //get an official auth token
  async function token(publicAddress){
    const tokenid = await auth.call('token')
    //set this to your session
    socket.tokenid = tokenid
    return tokenid
  }

  async function logout(tokenid=socket.tokenid){
    assert(auth,'auth server not enabled')
    await auth.call('logout',tokenid)
    emit('logout',socket.id,socket.userid)
    socket.userid = null
    return tokenid
  }

  function authenticate(...args){
    if(config.disableAuth){
      return fakeLogin(...args)
    }else{
      return login(...args)
       
    }

  }
  function unauthenticate(...args){
    logout(...args)
  }


  return {
    isValidSignature,
    login,
    logout,
    authenticate,
    unauthenticate,
    token,
    validate,
    user,
  }
}
