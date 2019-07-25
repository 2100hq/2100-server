const assert = require('assert')

//keep this simple for now
module.exports = (config,{commands,tokens,getWallets})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Create Token')
    },
    //this can only happen once, create will throw if anything already exists
    async 'Create Token'(cmd){
      //create token
      const token = await tokens.create({
        id:cmd.contractAddress,
        contractAddress:cmd.contractAddress,
        ownerShare:cmd.ownerShare,
        ownerAddress:cmd.ownerAddress,
        creatorAddress:cmd.creatorAddress,
        creatorReward:cmd.creatorReward,
        supply:cmd.supply,
        name:cmd.name,
        createdBlock:cmd.createdBlock,
        reward:cmd.reward,
      })

      //set token suppply
      await getWallets('internal').create({
        userid:token.contractAddress,
        tokenid:token.contractAddress,
        balance:token.supply
      })

      //create the creator and owner wallets if they dont exist
      await getWallets('internal').getOrCreate(token.ownerAddress,token.id)
      await getWallets('internal').getOrCreate(token.creatorAddress,token.id)

      return commands.success(cmd.id,'Token Created')
    }
  }
}



