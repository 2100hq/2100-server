var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const {walletId} = require('../../utils')
const bn = require('bignumber.js')
// const bn = require('big.js')

//wallets should be processed in wei strings
module.exports = function(config,table,emit=x=>x) {
  const {allowFloats} = config
  const validate = Validate(Schema(config))
  const defaults = Defaults(config)

  async function set(wallet) {
    wallet = validate(defaults(wallet))
    wallet.updated = Date.now()
    await table.set(wallet.id,wallet)
    emit('change',wallet)
    return wallet
  }

  async function get(userid,tokenid) {
    const id = walletId(userid,tokenid)
    assert(await table.has(id), 'That wallet does not exist')
    return table.get(id)
  }

  async function create(props) {
    props = defaults(props)
    if(props.id) assert(!(await table.has(props.id)), 'Wallet with that ID already exists')
    return set(props)
  }

  async function getOrCreate(userid,tokenid) {
    try {
      return await get(userid,tokenid)
    } catch (e) {
      return create({ userid,tokenid })
    }
  }

  async function canWithdraw(userid,tokenid,amount){
    const wallet = await get(userid,tokenid)
    amount = bn(amount)
    if(allowFloats){
      assert(amount.isFinite(), 'amount required to be a number!')
    }else{
      assert(amount.isInteger(), 'amount required to be a number!')
    }
    assert(amount.gt(0),'Withdraw amount must be above 0')
    assert(amount.lte(wallet.balance),'Withdraw amount exceeds balance')
    return wallet
  }

  async function deposit(userid,tokenid, amount) {
    const wallet = await get(userid,tokenid)
    const total = bn(wallet.balance).plus(amount).toString()
    return setBalance(userid,tokenid, total)
  }

  async function withdraw(userid,tokenid, amount) {
    const wallet = await get(userid,tokenid)
    const total = bn(wallet.balance).minus(amount).toString()
    return setBalance(userid,tokenid, total)
  }

  async function setBalance(userid,tokenid, amount) {
    const wallet = await get(userid,tokenid)
    amount = bn(amount)
    if(allowFloats){
      assert(amount.isFinite(), 'amount required to be a number!')
    }else{
      assert(amount.isInteger(), 'amount required to be a number!')
    }
    // going to allow balances to be negative for now....
    assert(amount.gte(0), 'balance must be 0 or greater')
    wallet.balance = amount.toString()
    return set(wallet)
  }

  // should really do this in a transaction
  // async function transfer(fromid, toid, value) {
  //   return [await withdraw(fromid, value), await deposit(toid, value)]
  // }

  return {
    ...table,
    set,
    get,
    create,
    withdraw,
    deposit,
    canWithdraw,
    // transfer,
    setBalance,
    getOrCreate,
  }
}

