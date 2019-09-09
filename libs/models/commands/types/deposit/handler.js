const assert = require('assert')
module.exports = (config,{commands,getWallets,blocks})=>{
  assert(getWallets,'requires wallets')
  assert(commands,'requires commands')
  assert(blocks,'requires commands')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Deposit')
    },
    async Deposit(cmd){
      const wallets = await getWallets(cmd.toWalletType)
      await wallets.getOrCreate(cmd.toAddress,cmd.tokenid)
      return wallets.deposit(cmd.toAddress,cmd.tokenid,cmd.value).then(async wallet=>{
        console.log('deposited',cmd)
        const block = await blocks.latest()
        await commands.createType('rebalanceStakes',{userid:cmd.toAddress,blockNumber:block.number})
        return commands.success(cmd.id,'Deposit Success',{balance:wallet.balance})
      }).catch(err=>{
        console.log(err)
        return commands.failure(cmd.id,err.message)
      })
    }
  }
}

