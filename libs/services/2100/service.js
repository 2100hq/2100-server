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

const Joins = require('../../models/joins')
const Queries = require('../../models/queries')
const Events = require('../../models/events')

const contracts = [
  require('2100-contracts/build/contracts/Controller'),
]

module.exports = async (config)=>{
  assert(config.mintingTickRate,'reqeuires a mintingTickRate')
  assert(config.cmdTickRate,'reqeuires a transactionTickRate')
  assert(config.confirmations,'requires confirmations')
  assert(config.primaryToken,'requires primary token symbol')

  //set a default for now to our dev chain id
  config.chainid = config.chainid || '2100'

  const emitter = new Emitter()


  config.contracts = contracts.map((json)=>{
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
    config.ethers.defaultStartBlock = lastBlock.number
  }

  libs.ethers = await Ethers(config.ethers,{},(...args)=>emitter.emit('eth',args))

  //authentication with ethers
  libs.authenticate = function(token,signed,address){
    assert(token,'requires session token')
    assert(signed,'requires signed token')
    assert(address,'requires public address')
    console.log({token,signed,address})
    return libs.ethers.utils.verifyMessage(token,signed) === address
  }

  const commandTypes = ['processBlock','pendingDeposit','withdrawPrimary','deposit','withdraw']
  libs.handlers = Handlers({...config,commandTypes},libs)

  //adding engines
  libs.engines = await Engines(config,libs)

  //data joins/ queries
  libs.joins = await Joins(config,libs)
  libs.query = await Queries(config,libs)
  libs.actions = await Actions(config,libs)

  //events to socket
  libs.events = await Events(config,libs,(...args)=>emitter.emit('api',args))
  
  libs.socket = await Socket(config.socket,libs)


  //events from ethers block chain
  emitter.on('eth',async ([type,data])=>{
    console.log(type,data)
    // try{
    //   switch(type){
    //     case 'block':{
    //       const block = await libs.ethers.getBlock(data)
    //       if(! await libs.blocks.has(data)){
    //         await libs.blocks.create(block)
    //       }
    //       return
    //     }
    //   }
    // }catch(err){
    //   console.log('eth event error',err)
    //   process.exit(1)
    // }
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
      return libs.socket[channel](args)
    }catch(err){
      console.log('socket event error',err)
      process.exit(1)
    }
  })

  loop(async x=>{
    const commands = await libs.commands.getDone(false)
    if(commands.length) console.log('processing',commands.length,'commands')
    return highland(commands)
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
    highland(lodash.orderBy(blocks,['id'],['asc']))
    .map(async block=>{
      // console.log(block)
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
    highland(lodash.orderBy(events,['id'],['asc']))
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

  // loop(async x=>{
  //   const transactions = await libs.transactions.pending.list()
  //   return libs.engines.transactions.tick(transactions)
  // },config.txTickRate).catch(err=>{
  //   console.log('transaction engine error',err)
  //   process.exit(1)
  // })

  loop(async x=>{
    const tokens = await libs.tokens.list()
    const commands = await libs.engines.minting.tick(tokens)
    return Promise.map(commands,props=>libs.commands.createType('transaction',props))

  },config.mintingTickRate).catch(err=>{
    console.log('minting engine error',err)
    process.exit(1)
  })

  return libs
}
