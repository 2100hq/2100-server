const assert = require('assert')
const Promise = require('bluebird')

module.exports = (config,{commands,eventlogs})=>{
  assert(config.confirmations,'requires confirmations count')
  assert(config.primaryToken,'requires primary token')
  assert(commands,'requires commands library')

  //addresses need to be lower cased for all comparisons in the rest of the system
  const handlers = {
    Deposit(event){
      //this command now issue a rebalance stakes command on success
      return commands.format('pendingDeposit',{
        userid:event.values.account.toLowerCase(),
        blockNumber:event.blockNumber,
        toAddress:event.values.account.toLowerCase(),
        tokenid:config.primaryToken,
        confirmations:Number(config.confirmations),
        transactionHash:event.transactionHash.toLowerCase(),
        balance:event.values.balance,
        value:event.values.amount,
      })
    },
    Withdraw(event){
      //this command now issue a rebalance stakes command on success
      return commands.format('withdrawPrimary',{
        userid:event.values.account.toLowerCase(),
        blockNumber:event.blockNumber,
        fromAddress:event.values.account.toLowerCase(),
        transactionHash:event.transactionHash.toLowerCase(),
        balance:event.values.balance,
        value:event.values.amount,
      })
    } ,
    //token creation event
    Create(event){
      return commands.format('createActiveToken',{
        userid:event.values.creator.toLowerCase(),
        name:event.values.username.toLowerCase(),
        transactionHash:event.transactionHash.toLowerCase(),
        blockNumber:event.blockNumber,
        createdBlock:event.blockNumber,
        creatorAddress:event.values.creator.toLowerCase(),
        contractAddress:event.values.token.toLowerCase(),
      })
    },
    //synthetic event produced at the end of each block.
    //find all tokens with stakers and generate stake rewards.
    RewardStakers(event){
      return commands.format('generateStakeRewards',{
        blockNumber:event.blockNumber,
        ...event.values
      })
    },
    Owner(event){
      console.log(event.name)
    },
    DAIAddress(event){
      console.log(event.name)
    },
  }

  async function tick(event){
    // console.log('starting event',event)
    assert(handlers[event.name],'no handler for event name: ' + event.name)
    const cmd = await await handlers[event.name](event)
    if(cmd) return commands.create(cmd)
  }

  function getCommand(event){
    // console.log('starting event',event)
    assert(handlers[event.name],'no handler for event name: ' + event.name)
    return handlers[event.name](event)
  }

  return {
    tick,
    handlers,
    getCommand,
  }
}
