const assert = require('assert')
const highland = require('highland')
const Promise = require('bluebird')
const {stringifyValues} = require('../../../../utils')
const lodash = require('lodash')

module.exports = (config,{ethers,blocks,eventlogs,commands,tokens})=>{
  const {primaryToken,contracts=[],disableBlockRewards=false,systemAddress} = config
  assert(primaryToken,'requires primary token symbol')
  assert(tokens,'requires tokens')
  assert(commands,'requires tokens')
  const {disableBlockRewards=false} = config
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

      console.log('disable rewards',disableBlockRewards)
      if(!disableBlockRewards){
        return commands.setState(cmd.id,'Stake Rewards',{eventids:events.map(x=>x.id})
      }

      return commands.success(cmd.id,'Processed Block Events',{eventids:events.map(x=>x.id),disableBlockRewards})
    },
    'Stake Rewards'(cmd){
      const activeTokens = await tokens.active.list()
      console.log('active',activeTokens)
      //should also probably filter unstaked tokens but maybe later
      const rewards = await Promise.map(activeTokens,(token,index)=>{
        return eventlogs.create({
          blockHash:cmd.hash,
          blockNumber:cmd.number,
          synthetic:true,
          index,
          name:'RewardStakers',
          values:{
            userid:systemAddress,
            tokenid:token.id,
            minimumStake:token.minimumStake,
            ownerShare:token.ownerShare,
            ownerAddress:token.ownerAddress,
            reward:token.rewared,
          }
        })              
      })
      console.log('rewards',rewards)
      return commands.success(cmd.id,'Processed Block Events And Rewards',{rewardids:rewards.map(x=>x.id),disableBlockRewards})
    }
  }
}
