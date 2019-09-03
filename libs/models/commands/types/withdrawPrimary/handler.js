const assert = require('assert')
const bn = require('bignumber.js')
module.exports = (config,{commands,blocks,getWallets})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(config.primaryToken,'requires primary token')
  assert(blocks,'requires blocks')

  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Withdraw Funds')
    },
    async 'Withdraw Funds'(cmd){
      const locked = await (await getWallets('locked')).getOrCreate(cmd.fromAddress,config.primaryToken)
      const available = await (await getWallets('available')).getOrCreate(cmd.fromAddress,config.primaryToken)
      const total = locked.balance + available.balance

      console.log({locked,available,total})
      const lockRemove = bn.min(locked.balance,cmd.value)
      const remainder = new bn(cmd.value).minus(lockRemove)
      const availableRemove = bn.min(remainder,available.balance)

      console.log(lockRemove.toString(),remainder.toString(),availableRemove.toString())
      if(lockRemove.isPositive()){
        await (await getWallets('locked')).withdraw(cmd.fromAddress,config.primaryToken,lockRemove.toNumber())
      }
      if(availableRemove.isPositive()){
        await (await getWallets('available')).withdraw(cmd.fromAddress,config.primaryToken,availableRemove.toNumber())
      }

      if(bn(cmd.value).isGreaterThan(total)){
        return commands.success(cmd.id,'Funds Overdrawn',{total})
      }

      const block = await blocks.latest()
      //we need to rebalance staking as soon as withdraw completes
      await commands.createType('rebalanceStakes',{blockNumber:block.number,userid:cmd.fromAddress})
      return commands.success(cmd.id,'Withdraw Success')
    },
  }
}
