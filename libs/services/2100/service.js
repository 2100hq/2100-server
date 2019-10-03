const assert = require('assert')
const Emitter = require('events')
const highland = require('highland')
const lodash = require('lodash')
const Promise = require('bluebird')
const moment = require('moment')

const Socket = require('../../socket')
const SocketClient = require('../../socket/client/socket')
const Engines = require('./engines')
const Actions = require('./actions')
const Handlers = require('./handlers')
const Stats = require('../../stats')

const {RethinkConnection,loop,GetWallets,Benchmark,sleep} = require('../../utils')
const RethinkModels = require('./models-rethink')
const MongoModels = require('../../models/init-mongo')
const Mongo = require('../../mongo')
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
  config.skipBlocks = parseInt(config.skipBlocks || 0)

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

  // const con = await RethinkConnection(config.rethink)
  const con = await Mongo(config.mongo)

  //starting libs with models
  // const libs = await RethinkModels(config,{con,mongo},(...args)=>emitter.emit('models',args))
  const libs = await MongoModels(config,{con},(...args)=>emitter.emit('models',args))

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
    'createTokenByTweet',    //user creating a token by tweet
    'createTokenByName',    //admin creating token by name
    'deposit',
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
  libs.processStats = await Stats(config,libs,(...args)=>emitter.emit('stats',args))

  //stats needs to warm
  await libs.processStats.init()

  emitter.on('models',async args=>{
    try{
      //write model events to the event reducer, this will output api events
      await libs.events.write(args)
    }catch(err){
      console.log('socket event error',err)
      process.exit(1)
    }
    try{
      //stats collector
      // console.log(...args)
      await libs.processStats.write(args)
    }catch(err){
      console.log('stats event error',err)
      process.exit(1)
    }
  })

  //this is mainly for auth stuff to know when someones authenticated
  emitter.on('actions',async ([channel,type,...args])=>{
    if(channel !== 'auth') return
    try{
      if(type === 'join'){
        //args=sessionid, channel
        await libs.socket.join(...args)
        if(args[1] == 'stats'){
          libs.socket.emit(args[0],'stats',[[[],await libs.query.statsState()]])
        }
      }
      if(type === 'leave'){
        //args=sessionid, channel
        await libs.socket.leave(...args)
      }
      if(type === 'login'){
        const [socketid,userid] = args
        await libs.socket.join(socketid,userid)
        const user = await libs.users.getOrCreate(userid)
        await libs.socket.private(userid,[],await libs.query.privateState(userid),socketid)
        if(!user.publicAddress){
          await libs.users.setPublicAddress(user.id,userid)
        }
        return
      }
      if(type === 'logout'){
        const [socketid,userid] = args
        await libs.socket.leave(socketid,userid)
        await libs.socket.private(userid,[],{})
        return
      }
    }catch(err){
      console.log('action error: ' + type,...args)
      console.log(err)
      process.exit(1)
    }
  })

  let usercount = 0
  libs.socket = await Socket(config,libs,(...args)=>emitter.emit('socket',args))

  emitter.on('socket',([channel,socketid])=>{
    // console.log('usercount',usercount)
    if(channel === 'connect') usercount++
    if(channel === 'disconnect') usercount--
    emitter.emit('models',['usercount','change',usercount])
    console.log('online',usercount)
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

  const eventlogStream = libs.eventlogs.readStream()

  const logBench = Benchmark()
  const cmdBench = Benchmark()
  loop(x=>{
    if(config.benchmarks) cmdBench.print()
    cmdBench.clear()
    // logBench.print()
    logBench.clear()
  },1000)

  //this needs to be processed first
  await libs.eventlogs.readStream(false)
    .sortBy((a,b)=>{
      return a.id < b.id ? -1 : 1
    })
    .doto(x=>logBench.new())
    .map(async event=>{
      // console.log('running event',event)
      const result = await libs.engines.eventlogs.tick(event)
      return libs.eventlogs.setDone(event.id)
    })
    .map(highland)
    .parallel(100)
    .doto(x=>logBench.completed())
    .last()
    .toPromise(Promise)


  let cmdStream = await libs.commands.readStream(false)
  await cmdStream
    .sortBy((a,b)=>{
      return a.id < b.id ? -1 : 1
    })
    // .doto(x=>console.log(x.id))
    .doto(x=>{
      if(x.state !== 'Start') return
      // console.log('new',x.type,x.id)
      cmdBench.new()
    })
    .doto(libs.engines.commands.optimized.write)
    .last()
    .toPromise(Promise)

  libs.engines.commands.optimized.resume()

  const alarms = new Map()

  emitter.on('models',([table,event,data])=>{
    if(table !== 'commands') return
    if(event === 'wake'){
      // console.log('running wake cmd',data.id)
      return libs.engines.commands.optimized.write(data)
    }
    if(event !== 'change') return
    // console.log('cmd model',data)
    if(data.done){
      cmdBench.completed()
      return
    }
    const now = Date.now()
    if(lodash.isBoolean(data.yield)){
      if(data.yield){
        return libs.engines.commands.optimized.write(data)
      }
    }
    if(lodash.isNumber(data.yield)){
      // console.log('yielding')
      if(data.yield <= now){
        return libs.engines.commands.optimized.write(data)
      }else{
        // console.log('setting alarm')
        return alarms.set(data.id,data.yield)
      }
    }
    if(data.state !== 'Start') return
    cmdBench.new()
    // console.log('new',data.type,data.id)
    libs.engines.commands.optimized.write(data)
  })

  //these wake commands after they yield
  loop(async x=>{
    alarms.forEach((value,key)=>{
      if(value < Date.now()){
        alarms.delete(key)
        libs.commands.wake(key).then(res=>{
          // console.log('command woke',key)
        }).catch(err=>{
          console.log('err waking cmd',err.message)
        })
      }
    })
  },1000).catch(err=>{
    console.log('alarm loop err',err)
    process.exit(1)
  })
  loop(async x=>{
    return libs.eventlogs.readStream(false)
      .sortBy((a,b)=>{
        return a.id < b.id ? -1 : 1
      })
      // .batch(1000)
      .doto(x=>logBench.new())
      // .flatten()
      .map(async event=>{
        // console.log('running event',event._id)
        const result = await libs.engines.eventlogs.tick(event)
        return libs.eventlogs.setDone(event.id)
      })
      .map(highland)
      .parallel(10)
      .doto(x=>logBench.completed())
      .last()
      .toPromise(Promise)

  },5000).catch(err=>{
    console.log('event engine error',err)
    process.exit(1)
  })

  let latestBlock 
  loop(async x=>{
    const block = await libs.blocks.latest()
    if(latestBlock == null || block.id != latestBlock.id){
      latestBlock = block
      emitter.emit('models',['blocks','change',block])
    }
  },1000)

  //command cleanup routine
  //const maxAge = moment().subtract(2,'days').valueOf()

  //loop(async x=>{
  //  return libs.commands.readStream(true)
  //    .filter(x=>{
  //      //only keep commands newer than maxage
  //      return x.created < maxAge
  //    })
  //    .map(x=>{
  //      // console.log('deleting command',x.id)
  //      return libs.commands.delete(x.id)
  //    })
  //    .flatMap(highland)
  //    .last()
  //    .toPromise(Promise)
  //},60*1000)


  return libs
}
