const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
module.exports = (config,{commands,getWallets,tokens,blocks,receipts})=>{
  assert(commands,'requires commands')
  assert(receipts,'requires receipts')
  assert(getWallets,'requires wallets')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires tokens.active')
  assert(blocks,'requires blocks')
  const {primaryToken} = config
  assert(primaryToken,'requires primary token')

  return {
    Start(cmd){
      if(cmd.tokenid.toLowerCase() === primaryToken.toLowerCase()){
        return commands.setState(cmd.id,'Cannot generate stake rewards on primary token')
      }
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
        return bn(stake.balance).isGreaterThanOrEqualTo(cmd.minimumStake || 0)
      })

      if(allowedStakes.length === 0){
        return commands.success(cmd.id,'No Rewards, No Stakers')
      }

      let total = bn.sum(...allowedStakes.map(s=>s.balance))

      const reward = bn.minimum(tokenWallet.balance,cmd.reward)

      //owner reward for block
      const ownerReward = reward.times(cmd.ownerShare)
      //reward to public, reduced by owners percent
      const publicReward = reward.minus(ownerReward)

      const block = await blocks.latest()

      await getWallets('available').withdraw(cmd.tokenid,cmd.tokenid,reward.toString())

      const r = await Promise.map(allowedStakes,async stake=>{
        const amount=bn(stake.balance).dividedBy(total).times(publicReward).integerValue(bn.ROUND_DOWN).toString()
        const userWallet = await getWallets('available').getOrCreate(stake.userid,cmd.tokenid)
        await getWallets('available').deposit(stake.userid,cmd.tokenid,amount)
        // console.log('processing stake',stake.id)
        return {
          type:'transferStakeReward',
          tokenid:cmd.tokenid,
          userid:stake.userid,
          blockNumber:block.number,
          created:Date.now(),
          done:true,
          amount,
        }
        // const receipt = await commands.format('transferStakeReward',{
        //   tokenid:cmd.tokenid,
        //   userid:stake.userid,
        //   blockNumber:block.number,
        //   done:true,
        //   amount,
        // })
        // console.log(receipt)
        return receipt
      })

      if(r.length){
        const userWallet = await getWallets('available').getOrCreate(cmd.ownerAddress,cmd.tokenid)
        await getWallets('available').deposit(cmd.ownerAddress,cmd.tokenid,ownerReward.toString())
        // const ownerReceipt = await commands.format('transferOwnerReward',{
          // tokenid:cmd.tokenid,
          // userid:cmd.ownerAddress,
          // blockNumber:block.number,
          // amount:ownerReward.toString(),
          // done:true,
        // })
        const ownerReceipt = {
          type:'transferOwnerReward',
          tokenid:cmd.tokenid,
          userid:cmd.ownerAddress,
          blockNumber:block.number,
          amount:ownerReward.toString(),
          done:true,
        }
        r.push(ownerReceipt)
      }

      await receipts.createAll(r)
      //const receipts = await Promise.map(allowedStakes,async stake=>{
      //  // console.log(bn(stake.balance).dividedBy(total).times(publicReward).toString())
      //  const command = await commands.createType('transferStakeReward',{
      //    tokenid:cmd.tokenid,
      //    userid:stake.userid,
      //    blockNumber:block.number,
      //    amount:bn(stake.balance).dividedBy(total).times(publicReward).integerValue(bn.ROUND_DOWN).toString()
      //  })
      //  return command.id
      //})

      ////apply owner reward only if there were stakes
      //if(receipts.length){
      //  const ownerReceipt = await commands.createType('transferOwnerReward',{
      //    tokenid:cmd.tokenid,
      //    userid:cmd.ownerAddress,
      //    blockNumber:block.number,
      //    amount:ownerReward.toString(),
      //  })

      //  receipts.push(ownerReceipt.id)
      //}

      // await getWallets('available').withdraw(cmd.tokenid,cmd.tokenid,reward.toString())

      // console.log('generated rewards',cmd.reward)
      return commands.success(cmd.id,'Rewards Generated',{})
    },
  }
}
