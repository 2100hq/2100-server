const assert = require('assert')

module.exports = (config,{commands,eventlogs,ethers})=>{
  assert(config.confirmations,'requires confirmations count')
  assert(config.primaryToken,'requires primary token')
  assert(commands,'requires commands library')
  assert(ethers,'requires ethers library')

  const handlers = {
    async Deposit(event){
      return commands.createType('pendingDeposit',{
        blockNumber:event.blockNumber,
        toAddress:event.values.account,
        tokenid:config.primaryToken,
        confirmations:Number(config.confirmations),
        value:Number(ethers.utils.formatEther(event.values.amount)),
      })
    }
  }

  async function tick(event){
    console.log('starting event',event)
    assert(handlers[event.name],'no handler for event name')
    return handlers[event.name](event)
  }

  return {
    tick,
    handlers
  }
}
