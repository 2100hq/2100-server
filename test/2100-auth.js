require('dotenv').config()
const assert = require('assert')
const test = require('tape')
const config = require('../libs/parseEnv')(process.env)
const Client = require('../libs/socket/client')
const ethers = require('ethers')

async function initAuth(auth,wallet,tokenid){
  assert(auth,'requires auth client')
  assert(wallet,'requires wallet client')

  if(tokenid){
    return auth.call('validate',tokenid).catch(err=>{
      return initAuth(auth,wallet)
    })
  }
  tokenid =  await auth.call('token')
  const signed = await wallet.signMessage('2100 Login: ' + tokenid) 
  return auth.call('authenticate',signed,wallet.address)
}

async function run(){
  let tokenid

  const provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
  const wallet = new ethers.Wallet(config.test.privateKey,provider)

  //2 differnet sessions
  const clients=[
    (await Client('ws://localhost:' + config.socket.port)),
    (await Client('ws://localhost:' + config.socket.port))
  ]

  const [client1, client2] = clients.map(client=>{
    return {
      private:client('private'),
      auth:client('auth'),
    }
  })

  tokenid = await initAuth(client1.auth,wallet/*,window.getStorage('token')*/)
  //window.setStorage('token',tokenid)
  console.log('client1',await client1.private.call('me'))

  //pretend we are a new sesssion
  tokenid = await initAuth(client2.auth,wallet,tokenid)
  console.log('tokenid',tokenid)
  await client2.auth.call('validate',tokenid)
  console.log('client2',await client2.private.call('me'))
}

run().then(x=>{
  console.log('done')
}).catch(err=>console.log(err))
