require('dotenv').config()
const test = require('tape')
const config = require('../libs/parseEnv')(process.env)
const Client = require('../libs/socket/client')
const ethers = require('ethers')


//must be running auth server
test('auth',t=>{
  let client,tokenid,actions,wallet,provider
  t.test('init',async t=>{
    provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
    wallet = new ethers.Wallet(config.test.privateKey,provider)
    client = (await Client('ws://localhost:' + config.socket.port))
    actions = {
      private:client('private'),
      public:client('public'),
      auth:client('auth'),
      admin:client('admin'),
    }
    t.ok(client)
    t.end()
  })
  t.test('token',async t=>{
    tokenid = await actions.auth.call('token')
    console.log(tokenid)
    t.end()
  })
  t.test('login',async t=>{
    const signed = await wallet.signMessage('2100 Login: ' + tokenid) 
    const result = await actions.auth.call('login',tokenid,signed,wallet.address)
    t.ok(result.id)
    t.end()
  })
  t.test('validate',async t=>{
    const result = await actions.auth.call('validate',tokenid)
    t.ok(result)
    t.end()
  })
  t.test('me',async t=>{
    const result = await actions.private.call('me')
    t.ok(result)
    t.end()
  })
  t.test('logout',async t=>{
    const result = await actions.auth.call('logout',tokenid)
    t.ok(result)
    t.end()
  })
  t.test('login',async t=>{
    const signed = await wallet.signMessage('2100 Login: ' + tokenid) 
    const result = await actions.auth.call('login',tokenid,signed,wallet.address).catch(t.ok)
    t.end()
  })
})
