module.exports = (config,{commands,wallets,getWallets})=>{
  assert(wallets,'requires wallets')
  assert(commands,'requires commands')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Withdraw')
    },
    async Withdraw(cmd){
      const wallet = await getWallets(cmd.fromWalletType)
      return wallet.withdraw(cmd.fromAddress,cmd.tokenid,cmd.value).then(wallet=>{
        return commands.setState(cmd.id,'Withdraw',{balance:wallet.balance})
      }).catch(err=>{
        return commands.failure(cmd.id,err.message)
      })
    }
  }
}


