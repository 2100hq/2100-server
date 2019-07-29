const assert = require('assert')
module.exports = (config,{query,getWallets,commands,tokens}) => {
  assert(tokens,'requires tokens')
  assert(getWallets,'requires tokens')
  assert(commands,'requires queries')

  //user scoped api
  return user =>{
    assert(user,'You must be logged in')

    async function createToken({name}){
      assert(name,'requires token name')
      assert(!(await query.hasPendingToken(name.toLowerCase())),'Token is already pending creation')
      return commands.createType('createPendingToken',{name,userid:user.id})
    }

    // async function stake({token,value}){
    //   const wallet = await queries.getWallet('DAI')
    //   const {balance} = await wallet.get(user.id)
    //   assert(value <= balance,'Not enough balance to stake: ' + value + ' vs ' + balance)
    //   await wallet.withdraw(user.id,value)

    //   try{
    //     return stakes.join(token,user.id,value)
    //   }catch(err){
    //     await wallets.deposit(userid,value)
    //     throw err
    //   }
    // }
    
    // async function unstake({token,value}){
    //   const wallet = await queries.getWallet('DAI')
    //   await stakes.leave(token,user.id,value)
    //   return wallet.deposit(user.id,value)
    // }

    return {
      createToken
    }
  }
}


