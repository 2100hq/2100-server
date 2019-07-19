const assert = require('assert')
const highland = require('highland')
const Promise = require('bluebird')
const {stringifyValues} = require('../../../../utils')
const lodash = require('lodash')

module.exports = (config,{ethers,blocks,eventlogs,commands})=>{
  const {primaryToken,contracts=[]} = config
  assert(primaryToken,'requires primary token symbol')
  //need list of topics/addresses

  return {
    async Start(cmd){
      //decode all logs for each contract
      const events = await highland(contracts)
        .map(async contract=>{
          const logs = await ethers.getLogs({blockHash:cmd.hash,address:contract.contractAddress})
          // console.log('logs',logs)
          return logs.map((log,index)=>{
            // console.log({log,contract})
            //decode logs and add meta data for the event
            const result = ethers.decodeLog(contract.abi,{
              //meta data with log
              blockHash:cmd.hash,
              blockNumber:cmd.number,
              contractName:contract.contractName,
              contractAddress:contract.contractAddress,
              index,
            })(log)
            result.values = stringifyValues(result.values)
            console.log({result})
            return lodash.omit(result,['decode'])
          })
        })
        .flatMap(highland)
        .flatten()
        .doto(x=>{
          console.log('log',x)
        })
        .map(eventlogs.create)
        .flatMap(highland)
        .collect()
        .toPromise(Promise)

      return commands.success(cmd.id,'Processed Block Events',{eventids:events.map(x=>x.id)})
    }
  }
}
