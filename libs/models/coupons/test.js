const test = require('tape')
const Data = require('.')

test('wallets',t=>{
  let model, cache
  t.test('model',t=>{
    t.test('init',t=>{
      cache = new Map()
      model = Data.Model({},cache )
      t.ok(model)
      t.end()
    })
  })
})

