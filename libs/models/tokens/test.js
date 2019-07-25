const test = require('tape')
const Data = require('.')

test('wallets',t=>{
  let model, cache
  t.test('model',t=>{
    t.test('init',t=>{
      cache = new Map()
      model = Data.Model({ownerShare:.01,ownerAddress:'test',creatorReward:'1',supply:'210000',reward:'1'},cache )
      t.ok(model)
      t.end()
    })
    t.test('create',async t=>{
      const token = await model.create({
        contractAddress:'test',
        creatorAddress:'test',
        createdBlock:1,
      })
      console.log(token)
      t.end()
    })
  })
})

