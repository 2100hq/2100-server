const SocketClient = require('../../socket/client')
const lodash = require('lodash')
const ethers = require('ethers')
const Promise = require('bluebird')
const assert = require('assert')
const {loop} = require('../../utils')

const contracts = [
  require('2100-contracts/build/contracts/Controller'),
  require('2100-contracts/build/contracts/DummyDAI'),
]

//bots require disabled auth
module.exports = async config =>{
  const provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
  provider.on('error',console.log)

  const socket = await SocketClient(config['2100'].host)
  const actions = {
    admin : socket('admin'),
    system : socket('system'),
    auth : socket('auth'),
  }

  const [controller,fakedai] = contracts.map(contract=>{
    return new ethers.Contract(contract.networks[config.chainid].address,contract.abi,provider)
  })

  await actions.auth.call('authenticate',undefined,config.systemAddress)
  await actions.system.call('setAdmin',{userid:config.systemAddress,isAdmin:true})

  function updateState(channel,state){
    return (...args)=>{
      if(args[0].length){
        lodash.set(state,...[channel,...args])
      }else{
        state[channel] = args[1]
      }
    }
  }

  async function initBot(host,privateKey,provider){
    assert(privateKey,'requires private key')
    assert(host,'requires host')
    assert(provider,'requires provider')

    const server = {private:{},public:{}}
    return {
      wallet : new ethers.Wallet(privateKey,provider),
      socket : await SocketClient(host),
      actions : {
        public: socket('public',updateState('public',server)),
        private: socket('private',updateState('private',server)),
        auth:socket('auth'),
      },
      server,
      state:'Start',
    }
  }
  
  let bots = await Promise.map(config.bots.keys,privateKey=>{
    console.log(privateKey)
    return initBot(config['2100'].host,privateKey,provider)
  })

  function Handler(config){
    const {privateKey} = config
    return {
      async Start(state){
        await state.actions.auth.call('authenticate',undefined,state.wallet.address)
        return 'ChooseAction'
      },
      Log(state){
        console.log(state.server.private)
      },
      Login(state){
      },
      SetBalance(state){
      },
      async Faucet(state){
        const primary = await fakedai.balanceOf(state.wallet.address)
        const systembal = await fakedai.balanceOf(config.systemAddress)
        const available = state.server.private.myWallets.available[state.server.public.primaryToken] || 0
        console.log({primary:primary.toString(),available,systembal:systembal.toString()})
        
      },
      async ChooseAction(state){
        const primaryBalance = await fakedai.balanceOf(state.wallet.address)
        const available = state.server.private.myWallets.available[state.server.public.primaryToken] || 0
        console.log({primaryBalance:primaryBalance.toString(),available})
        if(primaryBalance.eq(0) && available === 0){
          return 'Faucet'
        }
        return 'End'
      },
      async 'Wait Deposit'(state){
        console.log(state.server.private.me.id,'awaiting deposit')
        return 'ChooseAction'
      },
      CreateToken(state){
      },
      End(){
        return 'End'
      }
    }
  }

  const handler = Handler(config)

  loop(i=>{
    bots = Promise.map(bots,async bot=>{
      assert(handler[bot.state],'invalid state')
      console.log(bot.state)
      bot.state = await handler[bot.state](bot)
      return bot
    })
  },1000).catch(err=>{
    console.log(err)
    process.exit(1)
  })

}
