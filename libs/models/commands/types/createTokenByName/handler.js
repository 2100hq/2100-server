const assert = require('assert')
const bn = require('bignumber.js')

//keep this simple for now
module.exports = (config,{commands,tokens,getWallets,coupons,blocks})=>{
  assert(getWallets,'requires getWallets')
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires active tokens')
  assert(tokens.pending,'requires pending tokens')
  assert(coupons,'requires coupons')
  assert(coupons.create,'requires coupons.create')
  assert(blocks,'requires blocks')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Create Active Token')
    },
    //this can only happen once, create will throw if anything already exists
    //this assume the commands initilalized with all valid numbers.
    async 'Create Active Token'(cmd){
      let {name, ownerAddress,description, tweetType} = cmd
      name = name.toLowerCase()
      try{
        const exists = await tokens.active.getByName(name)
        assert(exists.length === 0,'Token exists: ' + name)
        const owns = await tokens.active.getByOwner(ownerAddress)
        assert(owns.length === 0,`${ownerAddress} owns a token already`)
      }catch(err){
        console.log(err)
        return commands.failure(id,err.message)
      }

      const block = await blocks.latest()

      const token = await tokens.active.create({
        id:name,
        description,
        creatorAddress:'0x0',
        ownerAddress,
        name,
        source:tweetType ? `twitter:${tweetType}` : 'internal',
        createdBlock:block.number
      })

      //set token suppply
      await getWallets('available').create({
        userid:token.id,
        tokenid:token.id,
        balance:token.supply
      })

      //create the creator and owner wallets if they dont exist
      await getWallets('available').getOrCreate(token.ownerAddress,token.id)

      /* NOTE: No on-chain creator */
      //---------------------------//
      // await getWallets('available').getOrCreate(token.creatorAddress,token.id)

      // if(creatorAddress && bn(creatorReward).isGreaterThan(0)){
      //   //submit creator reward command
      //   await commands.createType('transferCreatorReward',{
      //     blockNumber:block.number,
      //     userid:creatorAddress,
      //     tokenid:token.id,
      //     amount:creatorReward
      //   })
      // }
      return commands.setState(cmd.id,'Remove Pending')
    },
    async 'Remove Pending'(cmd){
      await tokens.pending.delete(cmd.name).catch(err=>err)
      return commands.success(cmd.id,'Token Created By Name')
    }
  }
}



