const assert = require('assert')
module.exports = (config,{commands,wallets,getWallets})=>{
  assert(wallets,'requires wallets')
  assert(commands,'requires commands')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Deposit')
    },
    async Deposit(cmd){
      const wallet = await getWallets(cmd.toWalletType)
      return wallet.deposit(cmd.toAddress,cmd.tokenid,cmd.value).then(wallet=>{
        return commands.success(cmd.id,'Deposit Success',{balance:wallet.balance})
      }).catch(err=>{
        return commands.failure(cmd.id,err.message)
      })
    }
  }
}

