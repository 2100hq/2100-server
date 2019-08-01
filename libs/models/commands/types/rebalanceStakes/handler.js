const lodash = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
//should be run in the transaction queue
//like anything which reads or writes wallets
const {validateStakes} = require('../../../../utils')
module.exports = (config,{commands,getWallets,tokens})=>{
  assert(commands,'requires commands table')
  assert(getWallets,'requires getWallets function')
  assert(tokens,'requires tokens table')
  assert(tokens.active,'requires active tokens table')
  return {
    async Start(cmd){
      try{
        validateStakes(cmd.stakes)
        assert(await tokens.active.hasAll(lodash.keys(cmd.stakes)),'Unable to stake on a token that is not active')
      }catch(err){
        return commands.failure(cmd.id,err.message)
      }
      return commands.setState(cmd.id,'Calculate All Stakes')
    },
    async 'Calculate All Stakes'(cmd){
      const wallets = await getWallets('stakes')
      //convert array of stakes to [tokenid]:balance object
      const currentStakes = lodash.reduce(await wallets.getByUser(cmd.userid),(result,value,id)=>{
        result[value.tokenid] = value.balance
        return result
      },{})

      const newStakes = {
        ...currentStakes,
        ...cmd.stakes
      }

      try{
        validateStakes(newStakes)
        assert(await tokens.active.hasAll(lodash.keys(newStakes)),'Unable to stake on a token that is not active')
      }catch(err){
        return commands.failure(cmd.id,err.message)
      }

      //throw here for now so we can see if this causes any problems by crashing
      //in future we can add the commented out code below to reset state
      await Promise.map(lodash.entries(newStakes),async ([tokenid,balance])=>{
        //make sure wallet exists
        await wallets.getOrCreate(cmd.userid,tokenid)
        return wallets.setBalance(cmd.userid,tokenid,balance)
      })

      //}catch(err){
      //  //if any errors occur, we will reset to original balance
      //  //if an error occurs here we will crash the app. if its common then we will have
      //  //to catch it and retry or do something sensible.
      //  await Promise.map(lodash.entries(currentStakes),async ([tokenid,balance])=>{
      //    await wallets.getOrCreate(cmd.userid,tokenid)
      //    return wallets.setBalance(cmd.userid,tokenid,balance)
      //  })
      //}

      return commands.success(cmd.id,'Stakes Updated')
    },
  }
}

