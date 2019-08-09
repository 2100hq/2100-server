const assert = require('assert')
const Promise = require('bluebird')

module.exports = (config,{commands,tokens,eventlogs,ethers,getWallets})=>{
  assert(config.confirmations,'requires confirmations count')
  assert(config.primaryToken,'requires primary token')
  assert(commands,'requires commands library')
  assert(ethers,'requires ethers library')
  assert(tokens,'requires tokens')
  assert(getWallets,'requires getWallets')

  //addresses need to be lower cased for all comparisons in the rest of the system
  const handlers = {
    async Deposit(event){
      //this command now issue a rebalance stakes command on success
      return commands.createType('pendingDeposit',{
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
    async Withdraw(event){
      //this command now issue a rebalance stakes command on success
      return commands.createType('withdrawPrimary',{
        userid:event.values.account.toLowerCase(),
        blockNumber:event.blockNumber,
        fromAddress:event.values.account.toLowerCase(),
        transactionHash:event.transactionHash.toLowerCase(),
        balance:event.values.balance,
        value:event.values.amount,
      })
    } ,
    //token creation event
    async Create(event){
      return commands.createType('createActiveToken',{
        userid:event.values.creator.toLowerCase(),
        name:event.values.username.toLowerCase(),
        transactionHash:event.transactionHash.toLowerCase(),
        createdBlock:event.blockNumber,
        creatorAddress:event.values.creator.toLowerCase(),
        contractAddress:event.values.token.toLowerCase(),
      })
    },
    //synthetic event produced at the end of each block.
    //find all tokens with stakers and generate stake rewards.
    async RewardStakers(event){
      return commands.createType('generateStakeRewards',{
        ...event.values
      })
    },
    async Owner(event){
      console.log(event)
    },
    async DAIAddress(event){
      console.log(event)
    },
  }

  async function tick(event){
    console.log('starting event',event.name)
    assert(handlers[event.name],'no handler for event name')
    return handlers[event.name](event)
  }

  return {
    tick,
    handlers
  }
}
