const lodash = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
const highland = require('highland')

const {stringifyValues} = require('../utils')

module.exports = (config,{eventlogs,ethers})=>{
  const {primaryToken,contracts=[]} = config
  assert(eventlogs,'requires eventlogs')
  assert(ethers,'requires ethers')
  assert(primaryToken,'requires primary token symbol')

  async function tick(block){
    return highland(contracts)
      .map(async contract=>{
        const logs = await ethers.getLogs({blockHash:block.hash,address:contract.contractAddress})
        // console.log('logs',logs)
        return logs.map((log,index)=>{
          //decode logs and add meta data for the event
          const result = ethers.decodeLog(contract.abi,{
            //meta data with log
            blockHash:block.hash,
            blockNumber:block.number,
            contractName:contract.contractName,
            contractAddress:contract.contractAddress,
            index,
            transactionHash:log.transactionHash,
          })(log)
          result.values = stringifyValues(result.values)
          return lodash.omit(result,['decode'])
        })
      })
      .flatMap(highland)
      .flatten()
      // .doto(x=>{
      //   console.log('log',x)
      // })
      .map(eventlogs.create)
      .flatMap(highland)
      .collect()
      .toPromise(Promise)
  }


  return {
    tick,
  }

}


