const EventLogs = require('../../models/eventlogs')
const Blocks = require('../../models/blocks')
const Tokens = require('../../models/tokens')
const Engines = require('../../engines')
const Stateful = require('../../models/stateful')
const {RethinkConnection,loop,Benchmark,sleep} = require('../../utils')
const Mongo = require('../../mongo')

const Ethers = require('../../ethers')
const highland = require('highland')
const Promise = require('bluebird')
const assert = require('assert')
const lodash = require('lodash')
// removing references to on chain contracts
// const ControllerContract = require('2100-contracts/build/contracts/Controller')

//contracts we want to listen for events on
const contracts = [
  // ControllerContract,
]

module.exports = async config =>{

  //set a default for now to our dev chain id
  config.chainid = config.chainid || '2100'
  // config.primaryToken = config.primaryToken || ControllerContract.networks[config.chainid].address
  assert(config.primaryToken,'requires primary token address or symbol')

  config.skipBlocks = parseInt(config.skipBlocks || 0)

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

  const con = await Mongo(config.mongo)
  // const con = await RethinkConnection(config.rethink)

  const libs = {
    eventlogs:EventLogs.Model( config, await EventLogs.Mongo({table:'events'},con)),
    blocks:Blocks.Model(config, await Blocks.Mongo({table:'blocks'},con)),
    tokens:{
      active:Tokens.Model(config.tokens, await Tokens.Mongo({table:'active_tokens'},con)),
    }
  }

  const blockStream = highland()
  libs.ethers = await Ethers(config.ethers,{},(...args)=>blockStream.write(args))

  libs.engines = {
    blocks:Engines.BlocksV2(config,libs),
  }


  //we need to init this with our last known block
  const lastBlock = await libs.blocks.latest()
  
  if(config.forceLatestBlock){
    if(lastBlock) await libs.blocks.setDone(lastBlock.id)
    await libs.ethers.start()
  }else if(config.defaultStartBlock){
    await libs.ethers.start(parseInt(config.defaultStartBlock || 0))
  }else if(lastBlock){
    //have to put this after we bind eth events
    await libs.ethers.start(lastBlock.number)
  }else{
    await libs.ethers.start(0)
  }

  blockStream
    .map(async ([type,data])=>{
      if(type !== 'block') return
      if(await libs.blocks.has(data)) return 
      // console.log('latest',data)
      const block = await libs.ethers.getBlock(data)
      // console.log('blockstream block',{number:block.number,hash:block.hash})
      await libs.blocks.create({
        number:block.number,
        hash:block.hash,
      })
    })
    .flatMap(highland)
    .errors(err=>{
      console.log('blockstream event',err)
      process.exit(1)
    })
    .resume()

  const processBlocks = highland((push,next)=>{
    libs.blocks.next().then(block=>{
      if(block){
        const id = ['processed',block.number].join('.')
        console.time(id)
        push(null,[block,()=>{
          next()
          console.timeEnd(id)
        }])
        // return push(null,[block,()=>{
        //   console.timeEnd(block.number)
        //   next()
        // }])
      }else{
        return sleep(1000).then(x=>next())
      }
    })
  })

  processBlocks
    .map(async ([block,done])=>{
      const logs = await libs.engines.blocks.getEvents(block)

      // console.log('inerting events',logs.length)
      const filtered = await Promise.filter(logs,async log=>{
        return (!(await libs.eventlogs.has(log.id)))
      })
      //batch insert
      console.log('inerting events',filtered.length)
      await libs.eventlogs.insert(filtered)
      await libs.blocks.setDone(block.id)
      done()
    })
    .map(highland)
    .mergeWithLimit(20)
    // .doto(x=>console.log('saved',x))
    .errors(err=>{
      console.log('eth event error',err)
      process.exit(1)
    })
    .resume()

}
