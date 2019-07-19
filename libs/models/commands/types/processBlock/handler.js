const assert = require('assert')
const highland = require('highland')
const Promise = require('bluebird')
const {stringifyValues} = require('../../../../utils')

module.exports = (config,{ethers,blocks,eventlogs,commands})=>{
  const {primaryToken,contracts=[]} = config
  assert(primaryToken,'requires primary token symbol')
  //need list of topics/addresses

  return {
    async Start(cmd){
      //decode all logs for each contract
      const events = await highland(contracts)
        .map(async contract=>{
          const logs = await ethers.getLogs({blockHash:cmd.hash,address:contract.address})
          return logs.map((log,index)=>{
            //decode logs and add meta data for the event
            const result = ethers.decodeLog(contract.abi,{
              //meta data with log
              blockHash:cmd.hash,
              blockNumber:cmd.number,
              contractName:contract.contractName,
              address:contract.contractAddress,
              index,
            })(log)
            result.values = stringifyValues(result.values)
          })
        })
        .flatMap(highland)
        .map(eventlogs.create)
        .flatMap(highland)
        .collect()
        .toPromise(Promise)

      return commands.success(cmd.id,'Processed Block Events',{eventids:events.map(x=>x.id)})
    }
  }
}
