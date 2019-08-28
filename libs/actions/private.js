const assert = require('assert')
const lodash = require('lodash')
const {validateStakes, parseTwitterUser} = require('../utils')
module.exports = (config,{query,getWallets,commands,tokens,blocks,users}) => {
  assert(tokens,'requires tokens')
  assert(tokens.active,'requires active tokens')
  assert(getWallets,'requires tokens')
  assert(commands,'requires queries')
  assert(blocks,'requires blocks')

  //user scoped api
  return user =>{
    assert(user,'You must be logged in')

    function me(){
      return user
    }

    function myCommandHistory({start=0,length=50}){
      return query.userCommandHistory(user.id,start,length)
    }

    function state(){
      return query.privateState(user.id)
    }

    async function stake(stakes){
      assert(await tokens.active.hasAll(lodash.keys(stakes)),'Unable to stake on a token that is not active')
      const {balance} = await getWallets('available').getOrCreate(user.id,config.primaryToken)
      validateStakes(stakes,balance)
      const {number} = await blocks.latest() 
      return commands.createType('setAbsoluteStakes',{userid:user.id,stakes,blockNumber:number})
    }

    async function verifyTwitter(link,description=''){
      assert(link,'requires tweet link')
      const name = parseTwitterUser(link)
      assert(!(await query.hasActiveTokenByName(name.toLowerCase())),'Token is already active')

      const owns = await tokens.active.getByOwner(user.id)
      assert(owns.length === 0,'You own a token already, try changing the token name instead')

      return commands.createType('createTokenByTweet',{
        userid:user.id,
        link,
        description,
      })
    }

    async function setFavorite(tokenid,favorite){
      assert((await tokens.active.has(tokenid)),'Invalid token id')
      return users.setFavorite(user.id,tokenid,favorite)
    }

    async function setTokenDescription(tokenid,description=''){
      const token = await tokens.active.get(tokenid)
      assert(token.ownerAddress.toLowerCase() === user.id.toLowerCase(),'You are not the owner')
      return tokens.active.setDescription(tokenid,description)
    }

    return {
      me,
      myCommandHistory,
      state,
      stake,
      setFavorite,
      setTokenDescription,
      verifyTwitter,
    }
  }
}


