const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
const lodash = require('lodash')

module.exports = (config,libs,emit=x=>x) =>{

  assert(libs.query,'requires query library')

  async function globalStatsHistory(block){
    const latest = await libs.stats.global.latest.get('latest')
    if(await libs.stats.global.history.has(block.number.toString())) return
    if(latest) return libs.stats.global.history.set({id:block.number.toString(),stats:latest.stats})
  }

  async function globalStats(){
    const tokens = await libs.tokens.active.list()
    const userCount = await libs.users.count()
    const dai = await libs.wallets.available.list()
    const totalDai = bn.sum(...dai.map(x=>x.balance)).toString(10)

    const stats = await libs.stats.stakes.latest.list()

    const totalStaking = stats.reduce((result,{stats})=>{
      const total = bn.sum('0',...Object.values(stats))
      return result.plus(total)
    },bn('0')).toString(10)


    return libs.stats.global.latest.set({
      id:'latest',
      stats:{
        tokenCount:tokens.length,
        userCount,
        totalDai,
        totalStaking,
      }
    })
  }


  async function write([table,method,data]){

    // disable this for now. currently doesnt work. each update
    // needs to finish write before handling next command.
    // if(table == 'commands'){
    //   if(!data.done) return
    //   if(data.type != 'transferStakeReward' && data.type != 'transferOwnerReward') return

    //   const id = [data.blockNumber.toString(),data.tokenid].join('!')
    //   // const id = data.tokenid

    //   const def = {
    //     id,
    //     stats:{
    //       tokenid:data.tokenid,
    //       blockNumber:data.blockNumber,
    //       users:{ }
    //     }
    //   }

    //   const blockStats = (await libs.stats.earned.blocks.get(id)) || def

    //   const earned = lodash.get(blockStats,['stats','users',data.userid],'0')
    //   const updatedEarned = bn(earned).plus(data.amount)
    //   lodash.set(blockStats,['stats','users',data.userid],updatedEarned.toString(10))
    //   // lodash.set(blockStats,['stats','blockNumber'],data.blockNumber)
    //   // console.log('blockstats',blockStats)
    //   return libs.stats.earned.blocks.set(blockStats)
    // }

    if(table == 'wallets.stakes'){
      const stats = await libs.query.detailedStakes(data.tokenid)
      // console.log('wallets.stakes',{stats,data})
      return libs.stats.stakes.latest.set({id:data.tokenid,stats})
    }
    if(table == 'wallets.available'){
      // console.log({stats,data})
      const stats = (await libs.stats.earned.latest.get(data.tokenid)) || {stats:{}}
      stats.stats[data.userid] = data.balance
      return libs.stats.earned.latest.set({id:data.tokenid,stats:stats.stats})
    }
    if(table == 'blocks'){
      //empty blocks somehow
      if(data == null) return
      //if we are skipping blocks for rewards then syncronize that with stats
      if(config.skipBlocks !== 0 && ((data.number%config.skipBlocks) !== 0)){
        // console.log('skipping',data.number % config.skipBlocks)
        return
      }
      // console.log('new block',data)
      const stats = await libs.stats.stakes.latest.list()
      // console.log('got stats',stats)
      const summed = await Promise.map(stats,async stat=>{
        const total = bn.sum('0',...Object.values(stat.stats))
        return {
          total:total.toString(10),
          stakers:lodash.mapValues(stat.stats,(value,userid)=>{
            return bn(value).dividedBy(total).toString(10)
          }),
          id:stat.id,
        }
      })
      const ordered = lodash.orderBy(summed,['total','created'],['desc','asc'])

      await Promise.map(ordered,async ({total,stakers,id},index)=>{
        // console.log('stats history',{id,total})
        const statid = [id,data.number].join('!')

        //do not update if id exists
        if(await libs.stats.stakes.history.has(statid)) return

        return libs.stats.stakes.history.set({
          id:statid,
          stats:{id,total,stakers,rank:index}
        })
      })
      
      await globalStats()
      await globalStatsHistory(data)
    }
  }

  async function init(){
    const stats = await libs.query.allStakesDetailed()
    const balances = await libs.query.allAvailableBalances()
    await Promise.map(Object.entries(stats),([key,stats])=>{
      return libs.stats.stakes.latest.set({id:key,stats})
    })

    await Promise.map(Object.entries(balances),([key,stats])=>{
      return libs.stats.earned.latest.set({id:key,stats})
    })

    return globalStats()
  }

  return {
    init,
    write,
  }
}
