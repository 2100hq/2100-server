const assert = require('assert')
const bn = require('bignumber.js')
const {validateTweet} = require('../../../../utils')

//keep this simple for now
//does not require pending token
module.exports = (config,{commands,tokens,blocks,getWallets})=>{
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires active tokens')
  assert(tokens.pending,'requires pending tokens')
  assert(getWallets,'requires getWallets')
  assert(blocks,'requires blocks')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Create Active Token')
    },
    async 'Create Active Token'(cmd){

      try{
        var name = await validateTweet(cmd.link,cmd.userid,cmd.prefix)
        assert(name,'Twitter name not found. Use full link to message.')

        //lowercase name for token
        name = name.toLowerCase()
        const exists = await tokens.active.getByName(name)
        assert(exists.length === 0,'Token exists: ' + name)
        const owns = await tokens.active.getByOwner(cmd.userid)
        assert(owns.length === 0,'You own a token already, try changing the token name instead')
      }catch(err){
        return commands.failure(cmd.id,err.message)
      }

      const block = await blocks.latest()

      const token = await tokens.active.create({
        id:name,
        description:cmd.description,
        ownerAddress:cmd.userid,
        creatorAddress:cmd.userid,
        name:name,
        createdBlock:block.number,
      })

      //set token suppply
      await getWallets('available').create({
        userid:token.id,
        tokenid:token.id,
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



