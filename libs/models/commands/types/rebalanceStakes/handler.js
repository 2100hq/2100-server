const assert = require('assert')
const lodash = require('lodash')
const Promise = require('bluebird')
const bn = require('bignumber.js')
//should be run in the transaction queue
//this is an accounting process which can be initiated by
//any event, but most likely a withdraw or deposit.
//it has to make sure our staking accounts match what our dai deposit is
module.exports = (config,{commands,getWallets})=>{
  assert(commands,'requires commands')
  assert(getWallets,'requires getWallets')
  assert(config.primaryToken,'requires primary token')

  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Validate Stakes')
    },
    async 'Validate Stakes'(cmd){
      const available = await getWallets('available').get(cmd.userid,config.primaryToken)
      const stakes = await getWallets('stakes').getByUser(cmd.userid)

      let staked = bn(0)

      if(stakes.length){
        staked = bn.sum(...stakes.map(x=>x.balance))
      }

      const delta = bn(available.balance).minus(staked)

      const update = {
        delta:delta.toString(),
        staked:staked.toString(),
        available:available.balance,
      }
      //this means our avaialble balance exeeeds our total staked wallets
      if(delta.isPositive()){
        //add stake
        return commands.setState(cmd.id,'Add Stake',update)
      }

      //this means our staking exceeds our dai balance
      if(delta.isNegative()){
        return commands.setState(cmd.id,'Reset Stakes',update)
      }

      return commands.success(cmd.id,'Stakes match available funds',update)
    },
    //in this case we add stake to the dai 
    //wallet, in order to allow user to 
    //add new stake amounts manually
    async 'Add Stake'(cmd){
      // console.log(cmd)
      await getWallets('stakes').getOrCreate(cmd.userid,config.primaryToken)
      const wallet = await getWallets('stakes').deposit(cmd.userid,config.primaryToken,cmd.delta)
      return commands.success(cmd.id,'Added Funds To Stake',{balance:wallet.balance})
    },
    //in this case we want to strategically remove stakes. 
    //v1: remove all stakes
    async 'Reset Stakes'(cmd){
      const stakes = await getWallets('stakes').getByUser(cmd.userid)
      //set all stakes to 0
      await Promise.map(stakes,wallet=>{
        return getWallets('stakes').setBalance(wallet.userid,wallet.tokenid,0)
      })
      //set primary token wallet to the total available balance, resetting users ability to stake
      const wallet = await getWallets('stakes').setBalance(cmd.userid,config.primaryToken,cmd.available)
      return commands.success(cmd.id,'Stakes Reset',{balance:wallet.balance})
    }
    //future unstaking strategies can be added as a new state transition
    // async 'Remove Stakes Until OK'(cmd)...
  }

}
