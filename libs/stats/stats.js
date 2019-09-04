const assert = require('assert')
const Promise = require('bluebird')
const bn = require('bignumber.js')
const lodash = require('lodash')

module.exports = (config,libs,emit=x=>x) =>{

  assert(libs.query,'requires query library')

  async function write([table,method,data]){
    if(table == 'wallets.stakes'){
      const stats = await libs.query.detailedStakes(data.tokenid)
      // console.log({stats,data})
      return libs.stats.stakes.latest.set({id:data.tokenid,stats})
    }
    if(table == 'blocks'){
      // console.log('new block',data)
      const stats = await libs.stats.stakes.latest.list()
      // console.log('got stats',stats)
      const summed = await Promise.map(stats,async stat=>{
        const total = bn.sum(...Object.values(stat.stats))
        return {
          total:total.toString(),
          holders:lodash.mapValues(stat.stats,(value,userid)=>{
            return bn(value).dividedBy(total).toString()
          }),
          id:stat.id,
        }
      })
      const ordered = lodash.orderBy(summed,['total','created'],['desc','asc'])

      return Promise.map(ordered,({total,holders,id},index)=>{
        // console.log('stats history',{id,total})
        return libs.stats.stakes.history.set({id:[id,data.number].join('!'),stats:{total,holders,rank:index}})
      })
    }
  }

  async function init(){
    const stats = await libs.query.allStakesDetailed()
    // console.log(libs.stats.stakes)
    return Promise.map(Object.entries(stats),([key,stats])=>{
      return libs.stats.stakes.latest.set({id:key,stats})
    })
  }

  return {
    init,
    write,
  }
}
