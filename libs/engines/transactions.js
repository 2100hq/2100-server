const lodash = require('lodash')
const Promise = require('bluebird')
const highland = require('highland')
const assert = require('assert')

module.exports = (config,{wallets,transactions})=>{
  const {stakes,internal,external,locked} = wallets
  const {success,pending,failure} = transactions
  assert(internal,'requires internal wallet')
  assert(external,'requires external wallet')
  assert(locked,'requires locked wallet')
  assert(success,'requires success transactions table')
  assert(pending,'requires pending transactions table')
  assert(failure,'requires failure transactions table')

  const handlers = {
    async mint(tx){
      return [
        await internal.withdraw(tx.from,tx.tokenid,tx.value),
        await internal.deposit(tx.to,tx.tokenid,tx.value)
      ]
    },
    async requestWithdraw(tx){
      return [
        await internal.withdraw(tx.from,tx.tokenid,tx.value),
        await pending.deposit(tx.to,tx.tokenid,tx.value)
      ]
    },
    async confirmWithdraw(tx){
      return [
        await pending.withdraw(tx.from,tx.tokenid,tx.value)
      ]
      //let the external block balance updator update external balance
    },
    async cancelWithdraw(tx){
      return [
        await pending.withdraw(tx.from,tx.tokenid,tx.value),
        await internal.deposit(tx.to,tx.tokenid,tx.value)
      ]
    },
    async requestDeposit(tx){
      return [await pending.deposit(tx.to,tx.tokenid,tx.value)]
    },
    async confirmDeposit(tx){
      return [
        await pending.withdraw(tx.from,tx.tokenid,tx.value),
        await internal.deposit(tx.to,tx.tokenid,tx.value)
      ]
    },
    async transfer(tx){
      assert(tx.from !== tx.to,'You cannot transfer to the same address')
      return [
        await internal.withdraw(tx.from,tx.tokenid,tx.value),
        await internal.deposit(tx.to,tx.tokenid,tx.value)
      ]
    },
    async stake(tx){
      return [
        await internal.withdraw(tx.from,tx.tokenid,tx.value),
        await stakes.deposit(tx.to,tx.tokenid,tx.value),
      ]
    },
    async unstake(){
      return [
        await stakes.withdraw(tx.from,tx.tokenid,tx.value),
        await internal.deposit(tx.to,tx.tokenid,tx.value),
      ]
    },
    //these shouldnt really be used unless under special ccircumstances, creating
    //new tokens, or testing
    async generate(tx){
      return [
        await internal.deposit(tx.to,tx.tokenid,tx.value),
      ]
    },
    async destroy(tx){
      return [
        await internal.withdraw(tx.from,tx.tokenid,tx.value),
      ]
    }
  }

  async function processTransaction(tx){
    assert(handlers[tx.type],'Unknown transaction type: ' + tx.id)
    return handlers[tx.type](tx)
  }

  async function tick(transactions=[]){
    return highland(transactions)
      .map(tx=>{
        return processTransaction(tx).then(wallets=>{
          return success.create(tx)
        }).catch(err=>{
          return failure.createWithError(tx,err)
        })
      })
      .flatMap(highland)
      .map(pending.remove)
      .flatMap(highland)
      .collect()
      .toPromise(Promise)
  }

  return {
    tick,
    processTransaction,
    handlers,
  }
}

