const test = require('tape')
const { Cache, Defaults, Schema, Rethink } = require('.')

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
  t.test('cache', t => {
    let cache
    t.test('init', t => {
      cache = Cache('test')
      t.ok(cache)
      t.end()
    })
    t.test('create', t => {
      const result = cache.create({ username: 'test' })
      t.equal(result.username, 'test')
      t.end()
    })
    t.test('create', t => {
      try {
        const result = cache.create({ id: 'test' })
      } catch (e) {
        t.ok(e)
        t.end()
      }
    })
    t.test('set', t => {
      const result = cache.set({ id: 'test', username: 'name' })
      t.equal(result.username, 'name')
      t.end()
    })
    t.test('create', t => {
      try {
        cache.create({ username: 'test' })
      } catch (e) {
        t.end()
      }
    })
    t.test('byUsername', t => {
      const result = cache.byUsername('test')
      t.equal(result.username, 'test')
      t.end()
    })
    t.test('update', t => {
      const result = cache.update('test', { first: 'gay' })
      t.equal(result.first, 'gay')
      t.end()
    })
  })
})
