const assert = require('assert')

module.exports = (config,{commands,eventlogs,ethers})=>{
  assert(config.confirmations,'requires confirmations count')
  assert(config.primaryToken,'requires primary token')
  assert(commands,'requires commands library')
  assert(ethers,'requires ethers library')

  //addresses need to be lower cased for all comparisons in the rest of the system
  const handlers = {
    async Deposit(event){
      return commands.createType('pendingDeposit',{
        userid:event.values.account.toLowerCase(),
        blockNumber:event.blockNumber,
        toAddress:event.values.account.toLowerCase(),
        tokenid:config.primaryToken,
        confirmations:Number(config.confirmations),
        balance:event.values.balance,
        value:event.values.amount,
      })
    },
    async Withdraw(event){
      return commands.createType('withdrawPrimary',{
        userid:event.values.account.toLowerCase(),
        blockNumber:event.blockNumber,
        fromAddress:event.values.account.toLowerCase(),
        balance:event.values.balance,
        value:event.values.amount,
      })
    }
  }

  async function tick(event){
    // console.log('starting event',event)
    assert(handlers[event.name],'no handler for event name')
    return handlers[event.name](event)
  }

  return {
    tick,
    handlers
  }
}
