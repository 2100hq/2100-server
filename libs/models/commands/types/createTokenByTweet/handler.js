const assert = require('assert')
const bn = require('bignumber.js')
const {validateTweet} = require('../../../../utils')

//keep this simple for now
//does not require pending token
module.exports = (config,{commands,tokens,blocks})=>{
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires active tokens')
  assert(tokens.pending,'requires pending tokens')
  assert(blocks,'requires blocks')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Validate Tweet')
    },
    //this can only happen once, create will throw if anything already exists
    //this assume the commands initilalized with all valid numbers.
    async 'Validate Tweet'(cmd){
      try{
        const name = await validateTweet(cmd.link,cmd.userid,cmd.prefix)
        assert(!(await query.hasActiveTokenByName(name.toLowerCase())),'Token exists: ' + name)
        return commands.setState(cmd.id,'Create Active Token',{name})

      }catch(err){
        return commands.failure(cmd.id,err.message)
      }

    },
    async 'Create Active Token'(cmd){
      const block = await blocks.latest()
      const token = await tokens.active.create({
        id:cmd.name,
        ownerAddress:cmd.userid,
        creatorAddress:cmd.userid,
        name:cmd.name,
        createdBlock:block.number,
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
          blockNumber:block.number,
          userid:cmd.creatorAddress,
          tokenid:token.id,
          amount:cmd.creatorReward
        })
      }
      return commands.setState(cmd.id,'Remove Pending')
    },
    async 'Remove Pending'(cmd){
      //only if it exists
      await tokens.pending.delete(cmd.name).catch(err=>{
        //ok do nothing
      })
      return commands.success(cmd.id,'Token Confirmed and Enabled')
    }
  }
}



