const test = require('tape')
const Commands = require('./')
const Stateful = require('../stateful')

test('commands',t=>{
  let model
  t.test('model',t=>{
    t.test('init',t=>{
      model = Commands.Model({},Stateful.Model({},new Map()))
      t.ok(model)
      t.end()
    })
    t.test('create transaction',async t=>{
      const result = await model.createType('transaction',{
        fromAddress:'test',
        toAddress:'test',
        tokenid:'test',
        fromWalletType:'test',
        toWalletType:'test',
        value:1,
        userid:'test',
      })
      console.log(result)
      t.ok(result)
      t.end()
    })
  })
})
