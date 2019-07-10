const assert = require('assert')

const Promise = require('bluebird')
const Socket = require('../../socket')
const Engines = require('./engines')
const Actions = require('./actions')
const {RethinkConnection,loop} = require('../../utils')
const RethinkModels = require('./models-rethink')

const Joins = require('../../models/joins')
const Queries = require('../../models/queries')
const Events = require('../../models/events')
const Emitter = require('events')

module.exports = async (config)=>{
  assert(config.mintingTickRate,'reqeuires a mintingTickRate')
  assert(config.txTickRate,'reqeuires a transactionTickRate')

  const emitter = new Emitter()

  const con = await RethinkConnection(config.rethink)

  //starting libs with models
  const libs = await RethinkModels(config,{con},(...args)=>emitter.emit('models',args))

  //adding engines
  libs.engines = await Engines(config,libs)

  //data joins/ queries
  libs.joins = await Joins(config,libs)
  libs.query = await Queries(config,libs)
  libs.actions = await Actions(config,libs)

  //events to socket
  libs.events = await Events(config,libs,(...args)=>emitter.emit('api',args))
  
  libs.socket = await Socket(config.socket,libs)


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
    const transactions = await libs.transactions.pending.list()
    return libs.engines.transactions.tick(transactions)
  },config.txTickRate).catch(err=>{
    console.log('transaction engine error',err)
    process.exit(1)
  })

  loop(async x=>{
    const tokens = await libs.tokens.list()
    const transactions = await libs.engines.minting.tick(tokens)
    return Promise.map(transactions,libs.transactions.pending.create)

  },config.mintingTickRate).catch(err=>{
    console.log('minting engine error',err)
    process.exit(1)
  })

  return libs
}
