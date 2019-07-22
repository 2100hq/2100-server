const assert = require('assert')
module.exports = (config,{getWallets,commands})=>{
  assert(getWallets,'requires wallets')
  assert(commands,'requires commands')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Withdraw')
    },
    async Withdraw(cmd){
      const wallet = await getWallets(cmd.fromWalletType)
      return wallet.withdraw(cmd.fromAddress,cmd.tokenid,cmd.value).then(wallet=>{
        return commands.setState(cmd.id,'Deposit')
      }).catch(err=>{
        return commands.failure(cmd.id,err.message)
      })
    },
    async Deposit(cmd){
      const wallet = await getWallets(cmd.fromWalletType)
      return wallet.deposit(cmd.toAddress,cmd.tokenid,cmd.value).then(wallet=>{
        return commands.success(cmd.id,'Transfer Success')
      }).catch(err=>{
        return commands.setState(cmd.id,'Return Withdraw')
      })
    },
    async 'Return Withdraw'(cmd){
      const wallet = await wallets[cmd.fromWalletType]
      assert(wallet,'No such wallet type ' + cmd.fromWalletType)
      return wallet.deposit(cmd.fromAddress,cmd.tokenid,cmd.value).then(wallet=>{
        return commands.success(cmd.id,'Transfer Success')
      }).catch(err=>{
        //do nothing, we have to make sure funds get returned
        //maybe crash app
        return commands.setState(cmd.id,'Return Withdraw',{fatal:err.message})
      })
    }
  }
}
