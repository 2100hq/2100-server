const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
module.exports = (config,{commands,getWallets,tokens})=>{
  assert(commands,'requires commands')
  assert(getWallets,'requires wallets')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires tokens.active')

  return {
    Start(cmd){
      return commands.setState(cmd.id,'Generate Rewards')
    },
    async 'Generate Rewards'(cmd){
      const token = await  tokens.active.get(cmd.tokenid)
      const stakes = await  getWallets('stakes').getByToken(cmd.tokenid)
      const tokenWallet = await  getWallets('available').get(cmd.tokenid,cmd.tokenid)

      if(bn(tokenWallet.balance).isEqualTo(0)){
        return commands.failure(cmd.id,'Token fully distributed')
      }

      //filter minmimum stakes
      const allowedStakes = stakes.filter(stake=>{
        return bn(stake.balance).isGreaterThanOrEqualTo(cmd.minimum || 0)
      })

      const total = bn.sum(...allowedStakes.map(s=>s.balance))

      const reward = bn.minimum(tokenWallet.balance,cmd.reward)

      //owner reward for block
      const ownerReward = reward.times(cmd.ownerShare)
      //reward to public, reduced by owners percent
      const publicReward = reward.minus(ownerReward)

      const receipts = await Promise.map(allowedStakes,async stake=>{
        const command = await commands.createType('transferStakeReward',{
          tokenid:cmd.tokenid,
          userid:stake.userid,
          amount:publicReward.dividedBy(total).times(reward).toString()
        })
        return command.id
      })

      //apply owner reward only if there were stakes
      if(receipts.length){
        const ownerReceipt = await commands.createType('transferOwnerReward',{
          tokenid:cmd.tokenid,
          userid:cmd.ownerAddress,
          amount:ownerReward.toString(),
        })

        receipts.push(ownerReceipt.id)
      }

      return commands.success(cmd.id,'Rewards Generated',{receipts})
    },
  }
}
