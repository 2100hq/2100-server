const assert = require('assert')
const lodash = require('lodash')
const Promise = require('bluebird')
module.exports = (config,libs)=>{

  async function getBlock(blocknumber){
    const block = await libs.blocks.get(blocknumber)
    block.transactions = await Promise.map(block.transactionids,getTransaction)
    return block
  }
  function latestBlock(){
    return libs.blocks.latest().then(x=>getBlock(x.number))
  }
  async function listBlocks(from){
    return libs.blocks.list(from).then(blocks=>Promise.map(blocks,block=>getBlock(block.number)))
  }

  function getStakesByUser(userid){
    return libs.stakes.getByUser(userid)
  }

  function getTransaction(transactionid){
    return libs.transactions.get(transactionid)
  }
  async function getToken(tokenid){
    const token = await libs.tokens.get(tokenid)
    const stakes = await libs.stakes.get(tokenid)

    return {
      ...token,
      stakes,
    }
  }
  function getTransactionsToUser(userid){
    return libs.transactions.byToUser(userid)
  }
  function getTransactionsFromUser(userid){
    return libs.transactions.byFromUser(userid)
  }
  function listTokens(){
    return libs.tokens.list()
  }
  function listUsers(){
    return libs.users.list()
  }
  function getTokenByName(token){
    return libs.tokens.getByName(token)
  }
  async function getWallet(token){
    assert(token,'requires token name')
    const wallet = await libs.wallets.get(token)
    assert(wallet,'no such wallet for token: ' + token)
    return wallet
  }

  async function listWalletTypes(){
    return [...libs.wallets.keys()]
  }

  async function getBalance(token,userid){
    assert(token,'requires token name')
    assert(userid,'requires userid of wallet to check')
    return getWallet(token).then(x=>x.getOrCreate(userid))
  }

  async function getUser(userid){
    assert(userid,'requires user id')
    return libs.users.get(userid)
  }

  async function listStakes(){
    return libs.stakes.list()
  }

  async function privateState(userid){
    const walletTypes = await listWalletTypes()
    // console.log({walletTypes})

    const tables = {
      myWallets:await Promise.reduce(walletTypes,async (result,token)=>{
        result[token]=await getBalance(token,userid)
        result[token].token = token
        return result
      },{}),     
      myStakes:lodash.keyBy((await getStakesByUser(userid)),'id')
    }
    return {
      private:tables,
      myWallets:lodash.values(tables.myWallets),
      myStakes:lodash.values(tables.myStakes),
      me:await getUser(userid),
    }
  }
  function adminState(){
    return {
    }
  }
  async function publicState(){
    const latest = await latestBlock()
    const previous = Math.max(0,latest.number-20)
    const tables = {
      tokens:lodash.keyBy((await listTokens()),'id'),
      blocks:lodash.keyBy((await listBlocks(previous)),'id'),
      stakes:lodash.keyBy((await listStakes()),'id'),
    }
    return {
      public:tables,
      tokens:lodash.values(tables.tokens),
      blocks:lodash.values(tables.blocks),
      stakes:lodash.values(tables.stakes),
      // tokens:lodash.keyBy((await listTokens()),'id'),
      // blocks:lodash.keyBy((await listBlocks(previous)),'id'),
      latestBlock ,
    }
  }

  return {
    getBlock,
    latestBlock,
    getStakesByUser,
    getTransaction,
    getTransactionsToUser,
    getTransactionsFromUser,
    getToken,
    listTokens,
    listUsers,
    getWallet,
    getBalance,
    publicState,
    privateState,
    adminState
  }
}
