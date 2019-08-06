const assert = require('assert')
const Emitter = require('events')
const highland = require('highland')
const lodash = require('lodash')
const Promise = require('bluebird')

const Socket = require('../../socket')
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

  //we need to init this with our last processed block
  const lastBlock = await libs.blocks.latest()
  if(lastBlock){
    config.ethers.defaultStartBlock = lastBlock.number + 1
  }

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
  ]

  libs.handlers = Handlers({...config,commandTypes},libs)

  //adding engines
  libs.engines = await Engines(config,libs)

  //data joins/ queries
  libs.joins = await Joins(config,libs)
  libs.query = await Queries(config,libs)
  libs.actions = await Actions(config,libs)

  //events to socket
  libs.events = await Events(config,libs,(...args)=>emitter.emit('api',args))

  libs.socket = await Socket(config,libs)


  //events from ethers block chain
  emitter.on('eth',async ([type,data])=>{
    try{
      switch(type){
        case 'block':{
          const block = await libs.ethers.getBlock(data)
          if(! await libs.blocks.has(data)){
            await libs.blocks.create(block)
          }
          return
        }
      }
    }catch(err){
      console.log('eth event error',err)
      process.exit(1)
    }
  })

  //write model events to the event reducer, this will output api events
  emitter.on('models',async args=>{
    try{
      await libs.events.write(args)
    }catch(err){
      console.log('socket event error',err)
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

  loop(async x=>{
    const commands = await libs.commands.getDone(false)
    if(commands.length) console.log('processing',commands.length,'commands')
    return highland(lodash.orderBy(commands,['id'],['asc']))
      .map(libs.engines.commands.runToDone)
      .flatMap(highland)
      .collect()
      .toPromise(Promise)
  },config.cmdTickRate).catch(err=>{
    console.log('command engine error',err)
    process.exit(1)
  })

  //loop over unprocessed blocks
  loop(async x=>{
    const blocks = await libs.blocks.getDone(false)
    // console.log(blocks)
    return highland(lodash.orderBy(blocks,['id'],['asc']))
    .map(async block=>{
      console.log('processing block',block.number)
      const result = await libs.engines.blocks.tick(block)
      // console.log('completed block')
      return libs.blocks.setDone(block.id)
    })
    .collect()
    .toPromise(Promise)
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
