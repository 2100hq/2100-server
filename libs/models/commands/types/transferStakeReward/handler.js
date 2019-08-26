const assert = require('assert')
module.exports = (config,{commands,getWallets,tokens})=>{
  assert(commands,'requires commands')
  assert(getWallets,'requires wallets')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires tokens.active')

  return {
    Start(cmd){
      return commands.setState(cmd.id,'Transfer Rewards')
    },
    async 'Transfer Rewards'(cmd){
      const userWallet = await getWallets('available').getOrCreate(cmd.userid,cmd.tokenid)
      const tokenWallet = await getWallets('available').getOrCreate(cmd.tokenid,cmd.tokenid)
      await getWallets('available').withdraw(cmd.tokenid,cmd.tokenid,cmd.amount)
      await getWallets('available').deposit(cmd.userid,cmd.tokenid,cmd.amount)
      return commands.success(cmd.id,'Staking Rewards Transferred')
    },
  }
}
