const assert = require('assert')

module.exports = (config,{commands,blocks,getWallets})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')

  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Create Pending Wallet')
    },
    async 'Create Pending Wallet'(cmd){
      const wallets = await getWallets('locked')
      //get or create the wallet
      const wallet = await wallets.getOrCreate(cmd.toAddress,cmd.tokenid)
      //deposit to locked wallet
      return commands.setState(cmd.id,'Set Pending')

    },
    async 'Set Pending'(cmd){
      const wallets = await getWallets('locked')
      await wallets.deposit(cmd.toAddress,cmd.tokenid,cmd.value)
      return commands.setState(cmd.id,'Wait For Confirmations')
    },
    async 'Wait For Confirmations'(cmd){
      const block = await blocks.latest()
      console.log('latest block',block.number,cmd.blockNumber,cmd.confirmations)
      if(Number(block.number) >= Number(cmd.blockNumber) + Number(cmd.confirmations || 20)){
        return commands.setState(cmd.id,'Credit Deposit')
      }else{
        return commands.yield(cmd.id)
      }
    },
    async 'Credit Deposit'(cmd){
      const locked = await getWallets('locked')
      const internal = await getWallets('internal')

      const userLocked = await locked.getOrCreate(cmd.toAddress,cmd.tokenid)
      const userInternal = await internal.getOrCreate(cmd.toAddress,cmd.tokenid)
      
      //its possible locked balance may be below what was initially set, in the case where
      //withdraws happened. so we just transfer the minimum between desired deposit and whats in locked.
      const transferAmount = Math.min(userLocked.balance,cmd.value)

      //this should be handled in a transfer state machine, but when state machines
      //rely on statemachines it requires a more complex infrastructure which will take more time. 
      try{
        await locked.withdraw(cmd.toAddress,cmd.tokenid,transferAmount)
        const wallet = await internal.deposit(cmd.toAddress,cmd.tokenid,transferAmount)
        return commands.success(cmd.id,'Deposit Success',{balance:wallet.balance})
      }catch(err){
        return commands.failure(cmd.id,err.message)
      }

    },
  }
}

