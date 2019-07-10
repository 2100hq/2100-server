const assert = require('assert')
module.exports = (config,{queries,wallets,stakes,mempool,users}) => user =>{
  assert(user,'requires user')

  function transfer({to,value}){
    mempool.create({
      from:user.id,
      to:to,
      value
    })
  }

  async function faucet(token='DAI'){
    assert(!user.faucetClaimed,'You have already claimed your free money!')
    const wallet = await wallets.get(token)
    // console.log('wallet',wallet,token)
    assert(wallet,'no such wallet for token: ' + token)
    await users.update(user.id,{faucetClaimed:true})
    return wallet.deposit(user.id,100)
  }

  async function stake({token,value}){
    const wallet = await queries.getWallet('DAI')
    const {balance} = await wallet.get(user.id)
    assert(value <= balance,'Not enough balance to stake: ' + value + ' vs ' + balance)
    await wallet.withdraw(user.id,value)

    try{
      return stakes.join(token,user.id,value)
    }catch(err){
      await wallets.deposit(userid,value)
      throw err
    }
  }
  
  async function unstake({token,value}){
    const wallet = await queries.getWallet('DAI')
    await stakes.leave(token,user.id,value)
    return wallet.deposit(user.id,value)
  }

  return {
    transfer,
    faucet,
    stake,
    unstake,
  }
}


