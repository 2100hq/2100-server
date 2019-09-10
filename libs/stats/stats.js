const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
const lodash = require('lodash')

module.exports = (config,libs,emit=x=>x) =>{

  assert(libs.query,'requires query library')

  async function globalStatsHistory(block){
    const latest = await libs.stats.global.latest.get('latest')
    return libs.stats.global.history.set({id:block.number.toString(),stats:latest.stats})
  }

  async function globalStats(){
    const tokens = await libs.tokens.active.list()
    const userCount = await libs.users.count()
    const dai = await libs.wallets.available.list()
    const totalDai = bn.sum(...dai.map(x=>x.balance)).toString()

    const stats = await libs.stats.stakes.latest.list()

    const totalStaking = stats.reduce((result,{stats})=>{
      const total = bn.sum(...Object.values(stats))
      return result.plus(total)
    },bn(0)).toString()


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
    if(table == 'wallets.stakes'){
      const stats = await libs.query.detailedStakes(data.tokenid)
      // console.log('wallets.stakes',{stats,data})
      return libs.stats.stakes.latest.set({id:data.tokenid,stats})
    }
    // if(table == 'wallets.available'){
    //   const stats = await libs.query.detailedStakes(data.tokenid)
    //   // console.log({stats,data})
    //   return libs.stats.stakes.latest.set({id:data.tokenid,stats})
    // }
    if(table == 'blocks'){
      // console.log('new block',data)
      const stats = await libs.stats.stakes.latest.list()
      // console.log('got stats',stats)
      const summed = await Promise.map(stats,async stat=>{
        const total = bn.sum(...Object.values(stat.stats))
        return {
          total:total.toString(),
          stakers:lodash.mapValues(stat.stats,(value,userid)=>{
            return bn(value).dividedBy(total).toString()
          }),
          id:stat.id,
        }
      })
      const ordered = lodash.orderBy(summed,['total','created'],['desc','asc'])

      await Promise.map(ordered,({total,stakers,id},index)=>{
        // console.log('stats history',{id,total})
        return libs.stats.stakes.history.set({id:[id,data.number].join('!'),stats:{id,total,stakers,rank:index}})
      })
      await globalStats()
      if(data) await globalStatsHistory(data)
    }
  }

  async function init(){
    const stats = await libs.query.allStakesDetailed()
    // console.log(libs.stats.stakes)
    await Promise.map(Object.entries(stats),([key,stats])=>{
      return libs.stats.stakes.latest.set({id:key,stats})
    })
    return globalStats()
  }

  return {
    init,
    write,
  }
}
