const lodash = require('lodash')
const Promise = require('bluebird')
const highland = require('highland')
const assert = require('assert')
module.exports = (config,{wallets})=>{
  const {stakes,internal} = wallets 
  assert(stakes,'requires stakes wallet')
  assert(internal,'requires internal wallet')

  //token:{
  //id:,
  //name,
  //total
  //minted
  //reward
  //}
  //stakers:{[address]:value}
  function mintTransactions(token,unminted,stakes=[]){
    const total = lodash.sumBy(stakes,'balance')

    //reward if there was no owner
    const reward = Math.min(token.reward, unminted)

    //owner reward for block
    const ownerReward = reward * token.ownerShare

    //reward to public, reduced by owners percent
    const publicReward = reward - ownerReward

    const transactions = stakes.map(({balance,userid})=>{
        return {
          type:'mint',
          token:token.id,
          from:token.id,
          to:userid,
          userid:'2100',
          value:publicReward/total * reward
        }
      })
      .filter(({value})=>value>0)

    //add owner reward transaction only if there are stakers
    if(transactions.length){
      transactions.push({
        type:'mint',
        token:token.id,
        from:token.id,
        to:'owner',
        userid:'2100',
        value:ownerReward,
      })
    }

    return transactions
  }

 async function tick(tokens=[]){
   return highland(tokens)
     .map(async token=>{
       const s = await stakes.getByToken(token.id)
       const balance = await internal.get(token.id,token.id)
       return mintTransactions(token,balance.balance,s)
     })
     .flatMap(highland)
     .flatten()
     .collect()
     .toPromise(Promise)
 }

  return {
    mintTransactions,
    tick,
  }

}

