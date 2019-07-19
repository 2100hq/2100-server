const lodash = require('lodash')
const Promise = require('bluebird')
const highland = require('highland')
const assert = require('assert')
const Step = require('../step')
const CommandTypes = require('../models/commands/types')

module.exports = (config,{handlers,commands})=>{
  const {tickRate=1,stepLimit=100} = config

  const step = Step(config,handlers)

  async function runToDone(command,steps=0){
    if(command.done) return command
    if(stepLimit) assert(steps < stepLimit,'Command failed to complete in ' + stepLimit + ' steps')
    const next = await tick(command)
    // assert(next.state !== command.state,'Command must transition state')
    await new Promise(res=>setTimeout(res,tickRate))
    return runToDone(next,steps+1)
  }

  async function tick(command){
    await step(command)
    return commands.get(command.id)
  }

  function tickAll(commands=[]){
    return highland(commands)
      .map(runToDone)
      .flatMap(highland)
      .collect()
      .toPromise(Promise)
  }

  return {
    tick,
    tickAll,
    runToDone,
  }
}

