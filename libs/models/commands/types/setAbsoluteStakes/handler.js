const lodash = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
//should be run in the transaction queue
//like anything which reads or writes wallets
const {validateStakes} = require('../../../../utils')
module.exports = (config,{commands,getWallets,tokens})=>{
  assert(commands,'requires commands table')
  assert(getWallets,'requires getWallets function')
  assert(tokens,'requires tokens table')
  assert(tokens.active,'requires active tokens table')
  assert(config.primaryToken,'requires primary token')
  return {
    async Start(cmd){
      return commands.setState(cmd.id,'Set Stakes')
    },
    async 'Set Stakes'(cmd){
      const stakes = await getWallets('stakes').getByUser(cmd.userid)
      const total = bn.sum(...stakes.map(x=>x.balance))
      const available = stakes.find(wallet=>wallet.tokenid.toLowerCase() === config.primaryToken.toLowerCase())

      //convert array of stakes to [tokenid]:balance object
      const currentStakes = stakes.reduce((result,wallet)=>{
        if(wallet.tokenid.toLowerCase() === config.primaryToken.toLowerCase()){
          //do not add
        }else{
          result[wallet.tokenid] = wallet.balance
        }
        return result
      },{})

      //new stakes but we need to adjust the primary token balance
      const newStakes = {
        ...currentStakes,
        ...cmd.stakes
      }
      // console.log('newstakes',newStakes,'total',total,'available',available.balance)

      try{
        validateStakes(newStakes,total)
        assert(await tokens.active.hasAll(lodash.keys(newStakes)),'Unable to stake on a token that is not active')
      }catch(err){
        console.log(err)
        return commands.failure(cmd.id,err.message)
      }

      //this gives us the total staked minus primary token, which will need to change
      const newStakeTotal = bn.sum(...lodash.values(newStakes))
      newStakes[config.primaryToken.toLowerCase()] = bn(total).minus(newStakeTotal).toString()
      // console.log('newstakes',newStakeTotal.toString())

      //throw here for now so we can see if this causes any problems by crashing
      //in future we can add the commented out code below to reset state
      await Promise.map(lodash.entries(newStakes),async ([tokenid,balance])=>{
        //make sure wallet exists
        await getWallets('stakes').getOrCreate(cmd.userid,tokenid)
        return getWallets('stakes').setBalance(cmd.userid,tokenid,balance)
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

      return commands.success(cmd.id,'Stakes Updated',{newStakes})
    },
  }
}

