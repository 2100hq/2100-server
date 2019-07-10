var lodash = require('lodash')
var assert = require('assert')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const {walletId} = require('../../utils')

module.exports = function(config,table,emit=x=>x) {
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
    assert(lodash.isFinite(amount),'Amount must be a finite number')
    assert(amount > 0,'Amount must be above 0')
    assert(wallet.balance >=amount,'Amount exceeds balance')
    return wallet
  }

  async function deposit(userid,tokenid, amount) {
    const wallet = await get(userid,tokenid)
    var total = wallet.balance + amount
    return setBalance(userid,tokenid, total)
  }

  async function withdraw(userid,tokenid, amount) {
    const wallet = await get(userid,tokenid)
    var total = wallet.balance - amount
    return setBalance(userid,tokenid, total)
  }

  async function setBalance(userid,tokenid, amount) {
    const wallet = await get(userid,tokenid)
    assert(lodash.isFinite(amount), 'amount required to be a number!')
    assert(amount >= 0, 'amount withdrawn is greater than balance')
    wallet.balance = amount
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

