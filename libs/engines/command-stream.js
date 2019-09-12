const lodash = require('lodash')
const Promise = require('bluebird')
const highland = require('highland')
const assert = require('assert')
const Commands = require('./commands')
const { loop, BenchTimer, } = require('../utils')

module.exports = (config,{handlers,commands})=>{
  const stream = highland()
  const {runToDone} = Commands(config,{handlers,commands})


  // const bench = BenchTimer({})
  // loop(x=>{
  //   console.log('avg cmd time',bench.avg().toFixed(2), 'on', bench.length(),'commands')
  // },1000)

  stream
    // .doto(x=>console.time(['command',x.type,x.id].join('.')))
    // .doto(x=>bench.start())
    .map(runToDone)
    .flatMap(highland)
    // .doto(x=>bench.end())
    // .doto(x=>console.timeEnd(['command',x.type,x.id].join('.')))
    .errors((err,next)=>{
      console.log('command stream error',err)
      process.exit(1)
    })
    .resume()

  return {
    write(cmd){
      stream.write(cmd)
    },
  }

}

