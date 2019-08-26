const assert = require('assert')
const bn = require('bignumber.js')

module.exports = (config,{commands,blocks,getWallets})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(blocks,'requires blocks')

  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Set Pending')
    },
    async 'Set Pending'(cmd){
      const wallets = await getWallets('locked')
      const wallet = await wallets.getOrCreate(cmd.toAddress,cmd.tokenid)
      await wallets.deposit(cmd.toAddress,cmd.tokenid,cmd.value)
      return commands.setState(cmd.id,'Wait For Confirmations')
    },
    async 'Wait For Confirmations'(cmd){
      const block = await blocks.latest()
      // console.log('latest block',block.number,cmd.blockNumber,cmd.confirmations)
      if((Number(block.number) + 1) >= Number(cmd.blockNumber) + Number(cmd.confirmations)){
        return commands.setState(cmd.id,'Credit Deposit')
      }else{
        return commands.yield(cmd.id,Date.now() + 50000)
      }
    },
    async 'Credit Deposit'(cmd){
      const locked = await getWallets('locked')
      const available = await getWallets('available')

      const userLocked = await locked.getOrCreate(cmd.toAddress,cmd.tokenid)
      const userAvailable = await available.getOrCreate(cmd.toAddress,cmd.tokenid)
      
      //its possible locked balance may be below what was initially set, in the case where
      //withdraws happened. so we just transfer the minimum between desired deposit and whats in locked.
      const transferAmount = bn.minimum(userLocked.balance,cmd.value).toString()
      // console.log('transfering deposit',transferAmount)

      //this should be handled in a transfer state machine, but when state machines
      //rely on statemachines it requires a more complex infrastructure which will take more time. 
      try{
        const block = await blocks.latest()
        await locked.withdraw(cmd.toAddress,cmd.tokenid,transferAmount)
        const wallet = await available.deposit(cmd.toAddress,cmd.tokenid,transferAmount)
        //we are firining off this command because we need to update staking wallets
        await commands.createType('rebalanceStakes',{userid:cmd.toAddress,blockNumber:block.number})
        return commands.success(cmd.id,'Deposit Success',{balance:wallet.balance})
      }catch(err){
        return commands.failure(cmd.id,err.message)
      }

    },
  }
}

