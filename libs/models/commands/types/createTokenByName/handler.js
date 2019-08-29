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

      try{
        const exists = await tokens.active.getByName(cmd.name.toLowerCase())
        assert(exists.length === 0,'Token exists: ' + cmd.name)
      }catch(err){
        console.log(err)
        return commands.failure(cmd.id,err.message)
      }

      const block = await blocks.latest()

      const token = await tokens.active.create({
        id:cmd.name,
        creatorAddress:cmd.creatorAddress,
        ownerAddress:cmd.ownerAddress,
        name:cmd.name,
        createdBlock:cmd.createdBlock,
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



