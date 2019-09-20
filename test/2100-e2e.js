require('dotenv').config()
const test = require('tape')
const config = require('../libs/parseEnv')(process.env)
const Client = require('../libs/socket/client')
const ethers = require('ethers')


//must be running auth server
test('auth',t=>{
  let client,tokenid,actions,wallet,provider
  let state = {}
  t.test('init',async t=>{
    provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
    wallet = new ethers.Wallet(config.test.privateKey,provider)
    actions = (await Client({host:'ws://localhost:' + config.socket.port,channels:['private','public','admin','auth','stats']},state))
    // actions = {
    //   private:client('private'),
    //   public:client('public'),
    //   auth:client('auth'),
    //   admin:client('admin'),
    // }
    t.ok(client)
    t.end()
  })
  t.test('token',async t=>{
    tokenid = await actions.auth.call('token')
    console.log(tokenid)
    t.end()
  })
  t.test('authenticate',async t=>{
    const signed = await wallet.signMessage('2100 Login: ' + tokenid) 
    const result = await actions.auth.call('authenticate',signed,wallet.address,tokenid)
    // const result = await actions.auth.call('authenticate',undefined,wallet.address)
    // t.ok(result.id)
    t.end()
  })
  // t.test('validate',async t=>{
  //   const result = await actions.auth.call('validate',tokenid)
  //   t.ok(result)
  //   t.end()
  // })
  t.test('me',async t=>{
    const result = await actions.private.call('me')
    console.log(result)
    t.ok(result)
    t.end()
  })
  t.test('setDescription',async t=>{
    const state = await actions.private.call('state')
    console.log(state.myTokens)
    const token = Object.values(state.myTokens)[0]
    if(token){
      const result = await actions.private.call('setTokenDescription',token.id,'test')
      console.log(result)
      t.ok(result)
    }
    t.end()
  })
  t.test('joinStats',async t=>{
    const result = await actions.auth.call('joinStats')
    t.end()
  })
  t.test('check stats',t=>{
    setTimeout(x=>{
      console.log('stas',state.stats)
      t.end()
    },100)
  })
  // t.test('createActiveToken',async t=>{
  //   const me = await actions.private.call('me')
  //   const token = {
  //     name:'test9',
  //     creatorAddress:me.id,
  //     ownerAddress:me.id,
  //   }
  //   const result = await actions.admin.call('createToken',token).catch(t.end)
  //   console.log(result)
  //   t.end()
  // })
  // t.test('verifyTwitter',async t=>{
  //   const me = await actions.private.call('me')
  //   const link = 'https://twitter.com/Twenty1Hundr3d/status/1166746884872052736'
  //   const result = await actions.private.call('verifyTwitter',{link,description:'first'}).catch(t.end)
  //   console.log(result)
  //   t.end()
  // })
  t.test('logout',async t=>{
    const result = await actions.auth.call('logout',tokenid)
    t.ok(result)
    t.end()
  })
  // t.test('login',async t=>{
  //   const signed = await wallet.signMessage('2100 Login: ' + tokenid) 
  //   const result = await actions.auth.call('login',tokenid,signed,wallet.address).catch(t.ok)
  //   t.end()
  // })
})

