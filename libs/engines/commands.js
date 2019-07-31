const lodash = require('lodash')
const Promise = require('bluebird')
const highland = require('highland')
const assert = require('assert')
const Step = require('../step')
const CommandTypes = require('../models/commands/types')

module.exports = (config,{handlers,commands})=>{
  const {tickRate=1,stepLimit=100} = config

  const step = Step(config,handlers)

  async function runToDone(command,steps=0,now=Date.now()){
    if(command.done) return command
    // if(lodash.isBoolean(command.yield) && command.yield) return command
    // if(lodash.isNumber(command.yield) && command.yield > now) return command

    if(stepLimit) assert(steps < stepLimit,'Command failed to complete in ' + stepLimit + ' steps')
    const next = await tick(command)

    if(next.done) return next
    if(lodash.isBoolean(next.yield) && next.yield) return next
    if(lodash.isNumber(next.yield) && next.yield > now) return next

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

