const assert = require('assert')
const bn = require('bignumber.js')

//keep this simple for now
module.exports = (config,{commands,tokens,getWallets})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires active tokens')
  assert(tokens.pending,'requires pending tokens')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Create Active Token')
    },
    //this can only happen once, create will throw if anything already exists
    //this assume the commands initilalized with all valid numbers.
    async 'Create Active Token'(cmd){
      const token = await tokens.active.create({
        id:cmd.contractAddress,
        contractAddress:cmd.contractAddress,
        ownerShare:cmd.ownerShare,
        ownerAddress:cmd.ownerAddress,
        creatorAddress:cmd.creatorAddress,
        creatorReward:cmd.creatorReward,
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

      if(await tokens.pending.has(cmd.name)){
        return commands.setState(cmd.id,'Remove Pending')
      }
      return commands.success(cmd.id,'Token Confirmed and Enabled')
    },
    async 'Remove Pending'(cmd){
      await tokens.pending.delete(cmd.name)
      return commands.success(cmd.id,'Token Confirmed and Enabled')
    }
  }
}


