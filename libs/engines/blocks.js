const lodash = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
const highland = require('highland')
module.exports = (config,{wallets,tokens,stakes,transactions,blocks})=>{
  const {internal} = wallets
  assert(internal,'requires internal wallet')

  async function applyTransaction(block,transaction){
    // console.log(block,transaction)
    transaction = await transactions.create({block,...transaction})
    const wallet = wallets.get(transaction.token)
    assert(wallet,'no such wallet for token ' + transaction.token)
    await wallet.deposit(transaction.to,transaction.value)
    await tokens.mint(transaction.token,transaction.value)
    return transaction
  }

  function tick(number,transactions){
    return highland(transactions)
      .map((transaction)=>{
        return applyTransaction(number,transaction)
      })
      .flatMap(highland)
      .collect()
      .map(transactions=>{
        return blocks.create({number,transactionids:transactions.map(x=>x.id)})
      })
      .flatMap(highland)
      .toPromise(Promise)
  }

  return {
    tick,
    applyTransaction
  }

}


