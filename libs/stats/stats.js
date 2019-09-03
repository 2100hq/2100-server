const assert = require('assert')
const Promise = require('bluebird')

module.exports = (config,libs,emit=x=>x) =>{

  assert(libs.query,'requires query library')

  async function write([table,method,data]){
    if(table == 'wallets.stakes'){
      const stats = await libs.query.detailedStakes(data.tokenid)
      console.log({stats,data})
      return libs.stats.stakes.set({id:data.tokenid,stats})
    }
  }

  async function init(){
    const stats = await libs.query.allStakesDetailed()
    // console.log(libs.stats.stakes)

    return Promise.map(Object.entries(stats),([key,stats])=>{
      return libs.stats.stakes.set({id:key,stats})
    })
  }

  return {
    init,
    write,
  }
}
