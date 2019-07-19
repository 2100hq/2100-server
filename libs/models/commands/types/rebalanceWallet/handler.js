//should be run in the transaction queue
module.exports = (config,{commands,getWallets})=>{
  return {
    async Start(cmd){
      const wallet = await getWallets(cmd.type)
      const {balance} = await wallets.get(cmd.accountid,cmd.tokenid)
      if(balance > cmd.matchBalance){
        return commands.setState(cmd.id,'Reduce Balance',{balance})
      }
      if(balance < cmd.matchBalance){
        return commands.setState(cmd.id,'Increase Balance',{balance})
      }
      return commands.success(cmd.id,'Balance Matched',{balance})
    },
    async 'Reduce Balance'(cmd){
      const value = cmd.balance - cmd.matchBalance
      const withdraw = await commands.withdraw({
        fromAddress:cmd.accountid,
        fromWalletType:cmd.walletType,
        tokenid:cmd.tokenid,
        value,
      })
      return commands.success(cmd.id,'Sent Withdrew',{withdrawid:withdraw.id})
    },
    async 'Increase Balance'(cmd){
      const value = cmd.matchBalance - cmd.balance
      const deposit = await commands.deposit({
        toAddress:cmd.accountid,
        tokenid:cmd.tokenid,
        fromWalletType:cmd.walletType,
        value,
      })
      return commands.success(cmd.id,'Sent Deposit',{depositid:deposit.id})
    }
  },

}
