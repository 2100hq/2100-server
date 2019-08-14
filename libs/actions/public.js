const assert = require('assert')

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
  }
}

