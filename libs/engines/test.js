const test = require('tape')
const Cache = require('../models/cache')
const Promise = require('bluebird')
const  Transactions = require('./transactions')
const  Minting = require('./minting')
const Models = {
  Wallets:require('../models/wallets'),
  Transactions:require('../models/transactions'),
  Tokens:require('../models/tokens'),
}

test('engine',t=>{
  let transactions,models
  const tokenid = 'test'
  const walletids=['a','b','c']
  t.test('init models',t=>{
    models = {
      tokens:Models.Tokens.Model({},Cache()),
      wallets:{
        internal:Models.Wallets.Model({},Cache()),
        external:Models.Wallets.Model({},Cache()),
        locked:Models.Wallets.Model({},Cache()),
        stakes:Models.Wallets.Model({},Cache()),
      },
      transactions:{
        success:Models.Transactions.Model({},Cache()),
        pending:Models.Transactions.Model({},Cache()),
        failure:Models.Transactions.Model({},Cache()),
      },
    }
    t.end()
  })
  t.test('transactions',t=>{
    t.test('init',t=>{
      transactions = Transactions({},models)
      t.ok(transactions)
      t.end()
    })
  })
  t.test('add pending tx',async t=>{
    const tx = await models.transactions.pending.mint({from:'a',to:'b',tokenid,value:10,block:0,userid:'test'})
    t.ok(tx)
    t.end()
  })
  t.test('tick error',async t=>{
    const txs = await models.transactions.pending.list()
    const [result] = await transactions.tick(txs).catch(t.end)
    t.ok(result.error)
    t.end()
  })
  t.test('init wallets',async t=>{

    await models.wallets.internal.create({
      userid:tokenid,tokenid
    })

    await Promise.map(walletids,id=>{
      return models.wallets.internal.create({
        userid:id,
        tokenid
      })
    })

    t.end()
  })
  t.test('minting',async t=>{
    await models.transactions.pending.generate({
      value:100,to:tokenid,from:'system',tokenid,userid:'test'
    })

    await Promise.map(walletids,id=>{
      return models.transactions.pending.mint({
        value:1,to:id,from:tokenid,tokenid,userid:'test'
      })
    })

    const txs = await models.transactions.pending.list()
    const result = await transactions.tick(txs).catch(t.end)
    const wallets = await models.wallets.internal.list()
    wallets.forEach(w=>{
      t.ok(w.balance)
    })
    t.end()

  })
  t.test('minting',t=>{
    let minting,token
    t.test('init',async t=>{
      minting = Minting({},models)
      token = await models.tokens.create({
        id:'test',
        name:'test',
        ownerShare:.1,
        createdBlock:0,
      })
      t.ok(minting)
      t.end()
    })
    t.test('tick',async t=>{
      const result = await minting.tick([token])
      console.log(result)
      t.end()
    })
    t.test('add minters',async t=>{
      await models.wallets.stakes.create({userid:'a',tokenid:'test',balance:1})
      await models.wallets.stakes.create({userid:'b',tokenid:'test',balance:1})
      t.end()
    })
    t.test('tick',async t=>{
      const result = await minting.tick([token]).catch(t.end)
      t.equal(result.length,3)
      t.end()
    })
  })
})
