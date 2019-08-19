require('dotenv').config()
const test = require('tape')
const config = require('../libs/parseEnv')(process.env)
const Client = require('../libs/socket/client')

//must be running auth server
test('auth',t=>{
  let client,tokenid
  t.test('init',async t=>{
    client = (await Client('ws://localhost:' + config.auth.socket.port))('auth')
    t.ok(client)
    t.end()
  })
  t.test('token',async t=>{
    tokenid = await client.call('token')
    console.log('token',tokenid)
    t.ok(tokenid)
    t.end()
  })
  t.test('user',async t=>{
    const result  = await client.call('user',tokenid).catch(t.end)
    t.notOk(result)
    t.end()
  })
  t.test('login',async t=>{
    const result  = await client.call('login',tokenid,'test')
    t.ok(result)
    t.end()
  })
  t.test('user',async t=>{
    const result  = await client.call('user',tokenid)
    t.equal(result,'test')
    t.end()
  })
  t.test('logout',async t=>{
    const result = await client.call('logout',tokenid)
    t.ok(result)
    t.end()
  })
  t.test('user',async t=>{
    try{
      await client.call('user',tokenid)
    }catch(e){
      t.ok(e)
    }
    t.end()
  })
  t.test('end',t=>{
    client.socket.disconnect()
    t.end()
  })
})
