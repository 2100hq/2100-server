const lodash = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
//should be run in the transaction queue
//like anything which reads or writes wallets
const {validateStakes,diffStakes} = require('../../../../utils')
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
      const processtime = [cmd.id,cmd.type,'processtime'].join('.')
      const querytimer = [cmd.id,cmd.type,'querytime'].join('.')
      const writetimer = [cmd.id,cmd.type,'writetime'].join('.')

      console.time(querytimer)
      const stakes = await getWallets('stakes').getByUser(cmd.userid)
      console.timeEnd(querytimer)

      console.time(processtime)
      // const total = bn.sum(...stakes.filter(x=>x.balance != '0').map(x=>x.balance),0)
      // const available = stakes.find(wallet=>wallet.tokenid.toLowerCase() === config.primaryToken.toLowerCase())

      // console.log({stakes})
      //convert array of stakes to [tokenid]:balance object
      const {total,currentStakes,newStakes,newStakeTotal} = stakes.reduce(({total,currentStakes,newStakes,newStakeTotal},wallet)=>{
        if(wallet.balance != '0'){
          total = total.plus(wallet.balance)
        }
        if(wallet.tokenid.toLowerCase() != config.primaryToken.toLowerCase()){
          currentStakes[wallet.tokenid] = wallet.balance || '0'
          newStakes[wallet.tokenid] = cmd.stakes[wallet.tokenid] || wallet.balance || '0'
          newStakeTotal = newStakeTotal.plus(newStakes[wallet.tokenid])
        }

        return {total,currentStakes,newStakes,newStakeTotal}
      },{total:bn(0),currentStakes:{},newStakes:cmd.stakes,newStakeTotal:bn(0)})

      ////new stakes but we need to adjust the primary token balance
      //const newStakes = {
      //  ...currentStakes,
      //  ...cmd.stakes
      //}
      // console.log('newstakes',newStakes,'total',total,'currentStakes',currentStakes)

      try{
        validateStakes(newStakes,total)
        assert(await tokens.active.hasAll(lodash.keys(newStakes)),'Unable to stake on a token that is not active')
      }catch(err){
        console.timeEnd(processtime)
        console.log(err)
        return commands.failure(cmd.id,err.message)
      }

      //this gives us the total staked minus primary token, which will need to change
      // const newStakeTotal = bn.sum(...lodash.values(newStakes))
      newStakes[config.primaryToken.toLowerCase()] = total.minus(newStakeTotal).toString()

      const diff = diffStakes(currentStakes,newStakes)
      console.timeEnd(processtime)
      // console.log({currentStakes,newStakes,diff})

      // console.log({newStakes})
      // console.log('newstakes',newStakeTotal.toString())

      console.time(writetimer)
      //throw here for now so we can see if this causes any problems by crashing
      //in future we can add the commented out code below to reset state
      await Promise.map(lodash.entries(diff),async ([tokenid,balance])=>{
        //make sure wallet exists
        // console.log('tokenid',tokenid,'balance',balance)
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

      const result = await commands.success(cmd.id,'Stakes Updated',{newStakes})
      console.timeEnd(writetimer)
      return result
    },
  }
}

