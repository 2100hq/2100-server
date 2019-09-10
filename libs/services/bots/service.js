const SocketClient = require('../../socket/client')
const lodash = require('lodash')
const ethers = require('ethers')
const Promise = require('bluebird')
const assert = require('assert')
const moment = require('moment')
const {loop} = require('../../utils')
const twitterNames = require('./top-twitter')
const Handler = require('./fake-deposit-handler')

const contracts = [
  // require('2100-contracts/build/contracts/Controller'),
  // require('2100-contracts/build/contracts/DummyDAI'),
]

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

//bots require disabled auth
module.exports = async config =>{
  const provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
  provider.on('error',console.log)

  const socket = await SocketClient(config.bots['2100'].host)
  const wallet = new ethers.Wallet(config.signer.privateKey,provider)
  //system wallet nonce
  let nonce = undefined
  const adminActions = {
    admin : socket('admin'),
    system : socket('system'),
    auth : socket('auth'),
  }

  // const [controller,fakedai] = contracts.map(contract=>{
  //   return new ethers.Contract(contract.networks[config.chainid].address,contract.abi,wallet)
  // })

  tokenid = await initAuth(adminActions.auth,wallet)
  // await adminActions.auth.call('validate',tokenid)
  await adminActions.system.call('setAdmin',{userid:config.systemAddress,isAdmin:true})

  function updateState(channel,state){
    return (...args)=>{
      // console.log(channel,...args)
      if(args[0].length){
        lodash.set(state[channel],...args)
      }else{
        state[channel] = args[1]
      }
    }
  }

  async function initBot({host,mnemonic,index}){
    assert(mnemonic,'requires mnemonic')
    assert(host,'requires host')

    const path = `m/44'/60'/${index}'/0/0`
    // const tokenName = ethers.wordlists.en.getWord(index)
    // const tokenName = ['bot',index].join('_')
    const tokenName = twitterNames[index].toLowerCase()
    assert(tokenName,'missing token name for index: '+ index)
    const server = {private:{},public:{}}
    let wallet = ethers.Wallet.fromMnemonic(mnemonic,path)
    wallet = new ethers.Wallet(wallet.privateKey,provider)
    const [controller,fakedai] = contracts.map(contract=>{
      return new ethers.Contract(contract.networks[config.chainid].address,contract.abi,wallet)
    })
    const socket = await SocketClient(config.bots['2100'].host)
    const actions =  {
      public: socket('public',updateState('public',server)),
      private: socket('private',updateState('private',server)),
      auth:socket('auth'),
    }

    tokenid = await initAuth(actions.auth,wallet)

    console.log('pk',wallet.privateKey)
    return {
      controller,
      fakedai,
      wallet,
      tokenName,
      socket,
      actions,
      adminActions,
      numstakes:config.bots.numstakes,
      log:(...args)=>{
        console.log(tokenName,...args)
        return args[0]
      },
      server,
      state:'Start',
    }
  }
  
  config.bots.start = parseInt(config.bots.start)
  config.bots.end = parseInt(config.bots.end)
  const count = config.bots.end - config.bots.start
  assert(count > 0,'must specify at least one bot')
  let bots = await Promise.all(lodash.times(count,index=>{
    index = index + config.bots.start
    return initBot({host:config['2100'].host,mnemonic:config.bots.mnemonic,index})
  }))


  const handler = Handler(config)

  loop(async i=>{
    bots = await Promise.mapSeries(bots,async bot=>{
      assert(handler[bot.state],'invalid state: ' + bot.state)
      bot.log(bot.state)
      bot.state = await handler[bot.state](bot)
      return bot
    })
  },1000).catch(err=>{
    console.log(err)
    process.exit(1)
  })

}
