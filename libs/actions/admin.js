const assert = require('assert')

module.exports = (config,libs) => user =>{
  assert(libs.addWallet,'requires function to add wallet')
  assert(libs.tokens,'requires tokens model')

  async function createToken({name}){
    assert(name,'requires a token name')
    const latest = await libs.blocks.latest()
    const result = await libs.tokens.create({id:name,name,createdBlock:latest.number})
    await libs.stakes.create({id:name})
    await libs.addWallet(name)
    return result
  }


  return {
    createToken
  }
}
