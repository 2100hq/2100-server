const EventLogs = require('../../models/eventlogs')
const Commands = require('../../models/commands')
const Engines = require('../../engines')
const Stateful = require('../../models/stateful')
const {RethinkConnection,loop,GetWallets,Benchmark} = require('../../utils')

const highland = require('highland')
const assert = require('assert')
const lodash = require('lodash')
const ControllerContract = require('2100-contracts/build/contracts/Controller')


module.exports = async config =>{

  //set a default for now to our dev chain id
  config.chainid = config.chainid || '2100'
  config.primaryToken = config.primaryToken || ControllerContract.networks[config.chainid].address

  const con = await RethinkConnection(config.rethink)

  const libs = {
    eventlogs:EventLogs.Model(
      config,
      await EventLogs.Rethink({table:'events'},con)
      // (...args)=>emit('eventlogs',...args)
    ),
    commands:Commands.Model(config, 
      Stateful.Model(config,
        // Commands.Cache(config, await Commands.Rethink({table:'commands'},con)),
        await Commands.Rethink({table:'commands'},con)
        // (...args)=>emit('commands',...args)
      )
    ),
  }

  libs.engines = {
    eventlogs:Engines.EventLogs(config,libs),
  }

  const bench = Benchmark()
  loop(async x=>{
    return libs.eventlogs.readStream(false)
      .sortBy((a,b)=>{
        return a.id < b.id ? -1 : 1
      })
      .batch(1000)
      .flatten()
      .doto(x=>bench.new())
      .map(async event=>{
        const result = await libs.engines.eventlogs.tick(event)
        return libs.eventlogs.setDone(event.id)
      })
      .flatMap(highland)
      .doto(x=>bench.completed())
      .last()
      .toPromise(Promise)

    // return highland(lodash.orderBy(events,['id'],['asc']))
    //   .map(async event=>{
    //     const result = await libs.engines.eventlogs.tick(event)
    //     return libs.eventlogs.setDone(event.id)
    //   })
    //   .flatMap(highland)
    //   .collect()
    //   .toPromise(Promise)
  },1000).catch(err=>{
    console.log('event engine error',err)
    process.exit(1)
  })

  loop(x=>{
    bench.print()
    bench.clear()
  },1000)
}
