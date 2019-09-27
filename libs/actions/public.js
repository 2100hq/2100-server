const assert = require('assert')
const Promise = require('bluebird')

module.exports = (config,libs) => user =>{
  function echo(x){
    return x
  }
  function state(){
    return libs.query.publicState()
  }

  //return key value of all stakers on token
  function tokenStakers(tokenid){
    return libs.query.detailedStakes(tokenid)
  }
  //return single value of users stakes on token
  function userStake(userid,tokenid){
    return libs.query.getUserStakeOnToken(userid,tokenid)
  }
  //return single value of users available balance on token
  function userHolding(userid,tokenid){
    return libs.query.getAvailableBalance(userid,tokenid)
  }
  //return all holders of a toekn keyed by address
  function tokenHolders(tokenid){
    return libs.query.detailedBalances(tokenid)
  }

  function ownedTokens(userid){
    assert(userid,'requires user address')
    return libs.tokens.active.getByOwner(userid)
  }
  async function isOwner(userid,tokenid){
    assert(userid,'requires user address')
    assert(tokenid,'requires tokenid')
    const token = await libs.tokens.active.get(tokenid.toLowerCase())
    return userid.toLowerCase() === token.ownerAddress.toLowerCase()
  }
  async function getTokenOwner(tokenid){
    return (await libs.tokens.active.get(tokenid)).ownerAddress
  }

  async function getStakeHistory(tokenid,blockStart,blockEnd){
    const block = await libs.blocks.latest()
    if(!blockStart) blockStart = block.number - 50
    if(!blockEnd) blockEnd = block.number
    // console.log({tokenid,blockStart,blockEnd})
    return libs.query.stakeHistoryStats(tokenid,blockStart,blockEnd)
  }

  async function getAllStakeHistory(blockStart,blockEnd){
    const block = await libs.blocks.latest()
    if(!blockStart) blockStart = block.number - 50
    if(!blockEnd) blockEnd = block.number
    const tokens = await libs.tokens.active.list()
    return Promise.reduce(tokens,async (result,token)=>{
      result[token.id] = await libs.query.stakeHistoryStats(token.id,blockStart,blockEnd)
      return result
    },{})
  }

  async function getGlobalStats(){
    return libs.query.globalStats()
  }

  async function statsState(){
    return libs.query.statsState()
  }

  async function getGlobalHistoryStats(blockStart,blockEnd){
    const block = await libs.blocks.latest()
    if(!blockStart) blockStart = block.number - 50
    if(!blockEnd) blockEnd = block.number
    return libs.query.globalHistoryStats(blockStart.toString(),blockEnd.toString())
  }

  return {
    echo,
    state,
    tokenStakers,
    userStake,
    userHolding,
    tokenHolders,
    ownedTokens,
    isOwner,
    getTokenOwner,
    getStakeHistory,
    getAllStakeHistory,
    getGlobalStats,
    getGlobalHistoryStats,
    statsState,
  }
}

