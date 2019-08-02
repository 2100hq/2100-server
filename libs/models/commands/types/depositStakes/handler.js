const assert = require('assert')
const lodash = require('lodash')
const Promise = require('bluebird')
//should be run in the transaction queue
module.exports = (config,{commands,getWallets})=>{
  assert(commands,'requires commands')
  assert(getWallets,'requires getWallets')
  assert(config.primaryToken,'requires primary token')

  return {
    async Start(cmd){
      return commands.success(cmd.id,'Validate Stakes',{balance})
    },
    async 'Validate Stakes'(cmd){
      const available = await getWallets('available').get(cmd.userid,config.primaryToken)
      const stakes = await getWallets('stakes').getByUser(cmd.userid)
      const staked = lodash.sumBy(stakes,'balance')
      if(available < staked){
        return commands.setState(cmd.id,'Unstake',{available,staked})
      }
      return commands.success(cmd.id,'Stakes did not need to be changed',{available,staked})
    },
    async 'Unstake'(cmd){
      const stakes = await getWallets('stakes').getByUser(cmd.userid)
      await Promise.map(stakes,wallet=>{
        if(wallet.tokenid.toLowerCase() === config.primaryToken.toLowerCase()){
          return getWallets('stakes').setBalance(wallet.userid,wallet.tokenid,cmd.available)
        }
        return getWallets('stakes').setBalance(wallet.userid,wallet.tokenid,0)
      })
    }
  },

}
