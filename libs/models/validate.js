const Validator = require('fastest-validator')

module.exports = schema => {
  const v = new Validator()
  var check = v.compile(schema)

  return function(data) {
    const result = check(data)
    if (result === true) return data
    const message = result.map(x => (x.message || 'Validation Failure')).join('\n')
    throw new Error(message)

    // const [first] = result
    // console.log(first.message)
    // throw new Error('validation error')
    // throw new Error(first.message)
  }
}
