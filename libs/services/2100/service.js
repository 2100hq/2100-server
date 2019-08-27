const assert = require('assert')
const Emitter = require('events')
const highland = require('highland')
const lodash = require('lodash')
const Promise = require('bluebird')

const Socket = require('../../socket')
const SocketClient = require('../../socket/client')
const Engines = require('./engines')
const Actions = require('./actions')
const Handlers = require('./handlers')

const {RethinkConnection,loop,GetWallets} = require('../../utils')
const RethinkModels = require('./models-rethink')
const Ethers = require('../../ethers')
const Signer = require('../../signer')

const Joins = require('../../models/joins')
const Queries = require('../../models/queries')
const Events = require('../../models/events')

const ControllerContract = require('2100-contracts/build/contracts/Controller')

//contracts we want to listen for events on
const contracts = [
  ControllerContract,
]

module.exports = async (config)=>{
  //set a default for now to our dev chain id
  config.chainid = config.chainid || '2100'

  assert(config.cmdTickRate,'requires a transactionTickRate')
  assert(config.confirmations,'requires confirmations')

  config.primaryToken = config.primaryToken || ControllerContract.networks[config.chainid].address

  assert(config.primaryToken,'requires primary token address or symbol')


  const emitter = new Emitter()


  config.contracts = contracts.map((json)=>{
    assert(json.contractName,'contract abi requires contractName')
    assert(json.networks,'contract abi requires networks')
    assert(json.networks[config.chainid],'contract networks requires chainid: ' + config.chainid)
    assert(json.abi,'contract abi requires abi')
    return {
      contractName:json.contractName,
      contractAddress:json.networks[config.chainid].address,
      abi:json.abi,
    }
  })

  const con = await RethinkConnection(config.rethink)

  //starting libs with models
  const libs = await RethinkModels(config,{con},(...args)=>emitter.emit('models',args))

  libs.getWallets = GetWallets(libs.wallets)

  libs.ethers = await Ethers(config.ethers,{},(...args)=>emitter.emit('eth',args))
  libs.signer = await Signer(config.signer,{provider:libs.ethers})

  //authentication with ethers
  libs.authenticate = function(token,signed,address){
    assert(token,'requires session token')
    assert(signed,'requires signed token')
    assert(address,'requires public address')
    // console.log({token,signed,address})
    const prefix = "2100 Login: "
    return libs.ethers.utils.verifyMessage(prefix+token,signed).toLowerCase() === address.toLowerCase()
  }

  if(!config.disableAuth){
    libs.auth = (await SocketClient(config.auth.host))('auth')
  }

  const commandTypes = [
    'pendingDeposit',     //handle blockchain pending deposits
    'withdrawPrimary',    //handle blockchain withdraws
    'createPendingToken', //handle pending tokens created from api
    'createActiveToken',  //handle blockchain tokens created from blockchain
    'rebalanceStakes',    //handle rebalancing stakes during withdraw/deposit
    'setAbsoluteStakes',    //handle user stakes updates
    'generateStakeRewards',    //handle user stakes updates
    'transferOwnerReward',    //handle crediting owner rewards
    'transferStakeReward',    //handle crediting stake rewards
    'transferCreatorReward',    //handle crediting creator rewards
    'createTokenByTweet',    //handle crediting creator rewards
  ]

  libs.handlers = Handlers({...config,commandTypes},libs)

  //adding engines
  libs.engines = await Engines(config,libs)

  //data joins/ queries
  libs.joins = await Joins(config,libs)
  libs.query = await Queries(config,libs)
  libs.actions = await Actions(config,libs,(...args)=>emitter.emit('actions',args))

  //events to socket
  libs.events = await Events(config,libs,(...args)=>emitter.emit('api',args))

  libs.socket = await Socket(config,libs)
  const blockStream = highland('eth',emitter)

  //events from ethers block chain
  blockStream.map(async ([type,data])=>{
    switch(type){
      case 'block':{
        const block = await libs.ethers.getBlock(data)
        if(! await libs.blocks.has(data)){
          await libs.blocks.create(block)
        }
        return data
      }
    }
    return data
  })
  .flatMap(highland)
  // .doto(x=>console.log('saved',x))
  .errors(err=>{
    console.log('eth event error',err)
    process.exit(1)
  })
  .resume()

  //write model events to the event reducer, this will output api events
  emitter.on('models',async args=>{
    try{
      await libs.events.write(args)
    }catch(err){
      console.log('socket event error',err)
      process.exit(1)
    }
  })


  //this is mainly for auth stuff to know when someones authenticated
  emitter.on('actions',async ([channel,type,...args])=>{
    if(channel !== 'auth') return
    if(type !== 'login') return
    try{
      const [socketid,userid] = args
      await libs.socket.join(socketid,userid)
      await libs.socket.private(userid,[],await libs.query.privateState(userid))
    }catch(err){
      console.log('action error: ' + type)
      console.log(err)
      process.exit(1)
    }
  })

  //take api events and write to socket channels
  emitter.on('api',async ([channel,...args])=>{
    try{
      // console.log('api update',channel,...args)
      return libs.socket[channel](...args)
    }catch(err){
      console.log('socket event error',err)
      process.exit(1)
    }
  })

  //we need to init this with our last known block
  const lastBlock = await libs.blocks.latest()
  
  if(config.forceLatestBlock){
    await libs.ethers.start()
  }else if(config.defaultStartBlock){
    await libs.ethers.start(parseInt(config.defaultStartBlock || 0))
  }else if(lastBlock){
    //have to put this after we bind eth events
    await libs.ethers.start(lastBlock.number)
  }else{
    await libs.ethers.start(0)
  }

  loop(async x=>{
    const commands = await libs.commands.getDone(false)
    let id 
    if(commands.length){
      id = lodash.uniqueId(['processing',commands.length,'commands',''].join(' '))
      console.log(id)
      console.time(id)
    }
    const result = await highland(lodash.orderBy(commands,['id'],['asc']))
      .map(libs.engines.commands.runToDone)
      .flatMap(highland)
      .collect()
      .toPromise(Promise)

    if(id) console.timeEnd(id)
    return result
  },config.cmdTickRate).catch(err=>{
    console.log('command engine error',err)
    process.exit(1)
  })

  let lastProcessed = 0
  //loop over unprocessed blocks
  loop(async x=>{
    let block = await libs.blocks.next()

    do{
      if(block == null) return
      if(lastProcessed){
        assert(lastProcessed === block.number-1,'Block processed out of order: ' + lastProcessed + ' vs ' + block.number)
      }
      lastProcessed = block.number
      console.log('processing block',block.number)
      const result = await libs.engines.blocks.tick(block)
      await libs.blocks.setDone(block.id)
      block = await libs.blocks.next()
    }while(block)

  },1000).catch(err=>{
    console.log('block engine error',err)
    process.exit(1)
  })

  loop(async x=>{
    const events = await libs.eventlogs.getDone(false)
    return highland(lodash.orderBy(events,['id'],['asc']))
      .map(async event=>{
        const result = await libs.engines.eventlogs.tick(event)
        return libs.eventlogs.setDone(event.id)
      })
      .flatMap(highland)
      .collect()
      .toPromise(Promise)
  },1000).catch(err=>{
    console.log('event engine error',err)
    process.exit(1)
  })

  // disable for now
  // loop(async x=>{
  //   const tokens = await libs.tokens.list()
  //   const commands = await libs.engines.minting.tick(tokens)
  //   return Promise.map(commands,props=>libs.commands.createType('transaction',props))

  // },config.mintingTickRate).catch(err=>{
  //   console.log('minting engine error',err)
  //   process.exit(1)
  // })

  return libs
}
