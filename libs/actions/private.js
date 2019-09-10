const assert = require('assert')
const lodash = require('lodash')
const {validateStakes, validateTweet,tweetTemplates} = require('../utils')
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
      // console.log('stake',stakes,balance)
      validateStakes(stakes,balance)
      const {number} = await blocks.latest()
      return commands.createType('setAbsoluteStakes',{userid:user.id,stakes,blockNumber:number})
    }

    async function verifyTwitter({link,tweetType='2100',description=''}){
      assert(link,'requires Tweet link')
      assert(link.indexOf('https://') === 0, 'Tweet link must start with https://')
      assert(tweetTemplates[tweetType], 'requires a correct Tweet type')
      const name = await validateTweet(link,user.id,tweetTemplates[tweetType])
      assert(!(await query.hasActiveTokenByName(name)),'Token is already active')

      const owns = await tokens.active.getByOwner(user.id)
      assert(owns.length === 0,'You own a token already')

      return commands.createType('createTokenByName',{
        userid:user.id,
        ownerAddress:user.id,
        name,
        link,
        tweetType,
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

    async function claimFakeDai(){
      assert(!user.claimed,'You have already claimed your dai')
      const {claimAmount} = config
      assert(claimAmount,'Admin has not set a claim amount')
      const cmd = await commands.createType('deposit',{
        toAddress:user.id,
        tokenid:config.primaryToken,
        toWalletType:'available',
        value:claimAmount,
        userid:user.id,
      })
      await users.setClaimed(user.id)
      return cmd
    }

    return {
      me,
      myCommandHistory,
      state,
      stake,
      setFavorite,
      setTokenDescription,
      verifyTwitter,
      claimFakeDai,
    }
  }
}


