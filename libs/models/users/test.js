const test = require('tape')
const { Model, Defaults, Schema, Rethink } = require('.')
const Cache = require('../cache')

test('users', t => {
  t.test('defaults', t => {
    let defaults
    t.test('init', t => {
      console.log(defaults)
      defaults = Defaults()
      t.ok(defaults)
      t.end()
    })
    t.test('call', t => {
      const result = defaults({})
      t.ok(result)
      t.end()
    })
  })
  t.test('model', t => {
    let cache,model
    t.test('init', t => {
      cache = Cache()
      model = Model({},cache)
      t.ok(cache)
      t.end()
    })
    t.test('create', async t => {
      const result = await model.create({id:'test', username: 'test' })
      t.equal(result.username, 'test')
      t.end()
    })
    // t.test('create', async t => {
    //   try {
    //     const result = await model.create({ id: 'test' })
    //   } catch (e) {
    //     t.ok(e)
    //     t.end()
    //   }
    // })
    // t.test('set', async t => {
    //   const result = await model.set({ id: 'test', username: 'name' })
    //   t.equal(result.username, 'name')
    //   t.end()
    // })
    // t.test('create', async t => {
    //   try {
    //     await model.create({ username: 'test' })
    //   } catch (e) {
    //     t.end()
    //   }
    // })
    // t.test('byUsername', t => {
    //   const result = model.byUsername('test')
    //   t.equal(result.username, 'test')
    //   t.end()
    // })
    // t.test('update', t => {
    //   const result = model.update('test', { first: 'gay' })
    //   t.equal(result.first, 'gay')
    //   t.end()
    // })
    t.test('setFavorite',async t=>{
      const result = await model.setFavorite('test','favorite')
      t.equal(result.favorites.length,1)
      t.end()
    })
    t.test('setFavorite',async t=>{
      await model.setFavorite('test','favorite')
      await model.setFavorite('test','favorite1')
      await model.setFavorite('test','favorite2')
      const result = await model.setFavorite('test','favorite1',false)
      t.equal(result.favorites.length,2)
      t.end()
    })
  })
})
