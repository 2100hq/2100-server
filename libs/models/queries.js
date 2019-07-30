const assert = require('assert')
const lodash = require('lodash')
const Promise = require('bluebird')
module.exports = (config,libs)=>{

  // async function getBlock(blocknumber){
  //   const block = await libs.blocks.get(blocknumber)
  //   return block
  // }
  function latestBlock(){
    return libs.blocks.latest()
  }
  // async function listBlocks(from){
  //   return libs.blocks.list(from).then(blocks=>Promise.map(blocks,block=>getBlock(block.number)))
  // }

  function getStakesByUser(userid){
    return libs.stakes.getByUser(userid)
  }

  // function getTransaction(transactionid){
  //   return libs.transactions.get(transactionid)
  // }
  async function getToken(tokenid){
    const token = await libs.tokens.get(tokenid)
    const stakes = await libs.stakes.get(tokenid)

    return {
      ...token,
      stakes,
    }
  }
  // function getTransactionsToUser(userid){
  //   return libs.transactions.byToUser(userid)
  // }
  // function getTransactionsFromUser(userid){
  //   return libs.transactions.byFromUser(userid)
  // }
  function listActiveTokens(){
    return libs.tokens.active.list()
  }
  function listPendingTokens(){
    return libs.tokens.pending.list()
  }
  function listDisabledTokens(){
    return libs.tokens.disabled.list()
  }
  function hasPendingToken(name){
    assert(name,'requires name to check')
    return libs.tokens.pending.has(name)
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

  async function getUserWallets(type,userid){
    assert(type,'requires wallet type')
    assert(userid,'requires userid')
    return libs.getWallets(type).getByUser(userid)
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

  async function userCommands(userid,done=false){
    return libs.commands.getUserDone(userid,done)
  }

  async function listCreateCoupons(){
    return libs.coupons.create.list()
  }

  async function userWithdrawCoupons(userid){
    return libs.coupons.withdraw.byUser(userid)
  }

  async function privateState(userid){
    return {
      myWallets:{
        available:lodash.keyBy(await getUserWallets('available',userid),'tokenid'),
        locked:lodash.keyBy(await getUserWallets('locked',userid),'tokenid')
      },
      myCommands: lodash.keyBy(await userCommands(userid),'id'),
      myCoupons:{
        withdraw:lodash.keyBy(await userWithdrawCoupons(userid),'id'),
      },
      me:{
        id:userid,
        publicAddress:userid,
        ...(await getUser(userid))

      }
    }
    // const walletTypes = await listWalletTypes()
    // // console.log({walletTypes})

    // const tables = {
    //   myWallets:await Promise.reduce(walletTypes,async (result,token)=>{
    //     result[token]=await getBalance(token,userid)
    //     result[token].token = token
    //     return result
    //   },{}),     
    //   myStakes:lodash.keyBy((await getStakesByUser(userid)),'id')
    // }
    // return {
    //   private:tables,
    //   myWallets:lodash.values(tables.myWallets),
    //   myStakes:lodash.values(tables.myStakes),
    //   me:await getUser(userid),
    // }
  }
  function adminState(){
    return {
    }
  }
  async function publicState(){
    return {
      latestBlock:await latestBlock() ,
      tokens: {
        active:lodash.keyBy((await listActiveTokens()),'id'),
        pending:lodash.keyBy((await listPendingTokens()),'id'),
        disabled:lodash.keyBy((await listDisabledTokens()),'id'),
      },
      coupons:{
        create:lodash.keyBy(await listCreateCoupons(),'id'),
      }
    }
  }

  return {
    // getBlock,
    latestBlock,
    getStakesByUser,
    // getTransaction,
    // getTransactionsToUser,
    // getTransactionsFromUser,
    getToken,
    listActiveTokens,
    listPendingTokens,
    listDisabledTokens,
    hasPendingToken,
    listUsers,
    getWallet,
    getBalance,
    publicState,
    privateState,
    adminState,
    userWithdrawCoupons,
    listCreateCoupons,
  }
}
