const assert = require('assert')
const bn = require('bignumber.js')

//keep this simple for now
module.exports = (config,{commands,tokens,getWallets,coupons})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires active tokens')
  assert(tokens.pending,'requires pending tokens')
  assert(coupons,'requires coupons')
  assert(coupons.create,'requires coupons.create')
  return {
    async Start(cmd){
      if(!(await tokens.pending.has(cmd.name))){
        return commands.failure(cmd.id,'Unable to find pending token to change it to active')
      }
      return commands.setState(cmd.id,'Create Active Token')
    },
    //this can only happen once, create will throw if anything already exists
    //this assume the commands initilalized with all valid numbers.
    async 'Create Active Token'(cmd){
      //need pending token to get owner address
      const pending = await tokens.pending.get(cmd.name)

      const token = await tokens.active.create({
        id:cmd.contractAddress,
        contractAddress:cmd.contractAddress,
        ownerShare:cmd.ownerShare,
        ownerAddress:pending.ownerAddress,
        creatorAddress:cmd.creatorAddress,
        creatorReward:cmd.creatorReward,
        minimumStake:cmd.minimumStake,
        supply:cmd.supply,
        name:cmd.name,
        createdBlock:cmd.createdBlock,
        decimals:cmd.decimals,
        reward:cmd.reward,
      })

      //set token suppply
      await getWallets('available').create({
        userid:token.contractAddress,
        tokenid:token.contractAddress,
        balance:token.supply
      })

      //create the creator and owner wallets if they dont exist
      await getWallets('available').getOrCreate(token.ownerAddress,token.id)
      await getWallets('available').getOrCreate(token.creatorAddress,token.id)

      if(cmd.creatorAddress && bn(cmd.creatorReward).isGreaterThan(0)){
        //submit creator reward command
        await commands.createType('transferCreatorReward',{
          userid:cmd.creatorAddress,
          tokenid:token.id,
          amount:cmd.creatorReward
        })
      }
      return commands.setState(cmd.id,'Remove Coupon')
    },
    //set coupon as done
    async 'Remove Coupon'(cmd){
      const pending = await tokens.pending.get(cmd.name)
      if(pending.couponid) await coupons.create.setDone(pending.couponid)
      return commands.setState(cmd.id,'Remove Pending')
    },
    async 'Remove Pending'(cmd){
      await tokens.pending.delete(cmd.name)
      return commands.success(cmd.id,'Token Confirmed and Enabled')
    }
  }
}



