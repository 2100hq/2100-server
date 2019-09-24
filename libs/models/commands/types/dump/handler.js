const assert = require('assert')
module.exports = (config,{commands,getWallets,tokens})=>{
  assert(commands,'requires commands')
  assert(getWallets,'requires wallets')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires tokens.active')

  return {
    Start(cmd){
      return commands.setState(cmd.id,'Dump')
    },
    async 'Dump'(cmd){
      const userWallet = await getWallets('available').getOrCreate(cmd.userid,cmd.tokenid)
      const tokenWallet = await getWallets('available').getOrCreate(cmd.tokenid,cmd.tokenid)
      await getWallets('available').withdraw(cmd.userid,cmd.tokenid,cmd.amount)
      await getWallets('available').deposit(cmd.tokenid,cmd.tokenid,cmd.amount)
      return commands.success(cmd.id,'Returned Tokens to Source')
    },
  }
}
