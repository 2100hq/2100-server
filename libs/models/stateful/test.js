const test = require('tape')
const { Defaults, Validate, Model } = require('.')

test('stateful', t => {
  let defaults, validate, model
  t.test('defaults', t => {
    t.test('init', t => {
      defaults = Defaults()
      t.ok(defaults)
      t.end()
    })
    t.test('call', t => {
      const result = defaults()
      t.ok(result)
      t.ok(result.id)
      t.end()
    })
  })
  t.test('validate', t => {
    t.test('init', t => {
      validate = Validate()
      t.ok(validate)
      t.end()
    })
    t.test('validate', t => {
      const result = validate(defaults({ extra: 'extra' }))
      t.ok(result)
      t.end()
    })
    t.test('fail validate', t => {
      try {
        const result = validate({ blah: 'test' })
        t.not(result)
      } catch (err) {
        t.end()
      }
    })
  })
  t.test('model', t => {
    t.test('init', t => {
      model = Model()
      t.ok(model)
      t.end()
    })
  })
})
