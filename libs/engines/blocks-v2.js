const lodash = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
const highland = require('highland')
const bn = require('bignumber.js')

const {stringifyValues} = require('../utils')

module.exports = (config,{eventlogs,ethers,tokens})=>{
  const {primaryToken,contracts=[],systemAddress,disableBlockRewards=false} = config
  assert(eventlogs,'requires eventlogs')
  assert(ethers,'requires ethers')
  assert(primaryToken,'requires primary token symbol')
  assert(tokens,'requires tokens')


  //generate synthetic block events to trigger stake rewards
  async function processStakeRewards(block,contract,startIndex){
    let activeTokens = await tokens.active.list()
    activeTokens = activeTokens.filter(x=>x.id.toLowerCase() !== primaryToken.toLowerCase())

    // console.log('active',activeTokens)
    //should also probably filter unstaked tokens but maybe later
    const rewards = await Promise.map(activeTokens,(token,index)=>{
        let reward = bn(token.reward)
        // console.log('skip blocks',config.skipBlocks,reward.toString())
        if(config.skipBlocks > 0){
          reward = reward.multipliedBy(config.skipBlocks)
        }
      // console.log(block.number,{index,startIndex},contract.contractAddress)
      return eventlogs.format({
        blockHash:block.hash,
        blockNumber:block.number,
        synthetic:true,
        index:index + startIndex,
        contractAddress:primaryToken.toLowerCase(),
        contractName:primaryToken.toLowerCase(),
        name:'RewardStakers',
        topic:'RewardStakers',
        transactionHash:'0xF',
        signature:'RewardStakers()',
        values:{
          userid:systemAddress,
          tokenid:token.id,
          minimumStake:token.minimumStake || '1',
          ownerShare:token.ownerShare,
          ownerAddress:token.ownerAddress,
          reward:reward.toString(),
        }
      })

    })
    // console.log('rewards',rewards)
    return rewards
  }

  async function tick(block){
    const events = await highland(contracts)
      .map(async contract=>{
        const logs = await ethers.getLogs({fromBlock:block.number,toBlock:block.number,address:contract.contractAddress})
        // console.log('logs',logs)
        return logs.map((log,index)=>{
          // console.log('log index',index,block.number)
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
          // console.log('eventlog',result)
          return lodash.omit(result,['decode'])
        })
      })
      .flatMap(highland)
      .flatten()
      // .doto(x=>{
      //   console.log('eventlog',x)
      // })
      .map(eventlogs.format)
      .map(eventLogEngine.tick)
      .collect()
      .toPromise(Promise)

    if(disableBlockRewards) return events
    //hope contract 0 is 2100 controller contract
    const rewards = await processStakeRewards(block,contracts[0],events.length)

    return [
      ...events,...rewards
    ]

  } 

  async function getLogEvents(contract,block){
    const logs = await ethers.getLogs({fromBlock:block.number,toBlock:block.number,address:contract.contractAddress})

    return logs.map((log,index)=>{
      // console.log('log index',index,block.number)
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
      // console.log('eventlog',result)
      return eventlogs.format(lodash.omit(result,['decode']))
    })
  }

  async function getEvents(block){
    let events = []
    if(contracts.length){
      events = await getLogEvents(contracts[0],block)
    }
    // console.log('disabledblockrewareds',disableBlockRewards)
    if(disableBlockRewards) return events
    // console.log('generating rewards')
    //hope contract 0 is 2100 controller contract
    // console.log('blocks',block.number,((block.number%config.skipBlocks) === 0),config.skipBlocks)
    if(config.skipBlocks === 0 || ((block.number%config.skipBlocks) === 0)){
      console.log('stake rewards',block.number)
      const rewards = await processStakeRewards(block,contracts[0],events.length)
      events.push(...rewards)
    }
    return events

  }

  return {
    getEvents,
    tick,
  }

}



