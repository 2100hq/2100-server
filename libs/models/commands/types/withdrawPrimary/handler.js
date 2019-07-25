const assert = require('assert')
const bn = require('bignumber.js')
module.exports = (config,{commands,blocks,getWallets})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(config.primaryToken,'requires primary token')

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
      return commands.success(cmd.id,'Withdraw Success')
    },
  }
  // async 'Wait For Confirmations'(cmd){
  //   const block = await blocks.latest()
  //   // console.log('latest block',block.number,cmd.blockNumber,cmd.confirmations)
  //   if(Number(block.number) >= Number(cmd.blockNumber) + Number(cmd.confirmations || 1)){
  //     return commands.setState(cmd.id,'Withdraw')
  //   }else{
  //     return commands.yield(cmd.id)
  //   }
  // },
  // async Withdraw(cmd){
  //   const locked = (await getWallets('locked')).getOrCreate(cmd.fromAddress,cmd.tokenid)
  //   const available = (await getWallets('available')).getOrCreate(cmd.fromAddress,cmd.tokenid)
  //   const total = locked.balance + available.balance
  // }

}
