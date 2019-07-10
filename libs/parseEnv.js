const lodash = require('lodash')

const isEnvArray = (value = '') => {
  return value.toString().includes(',')
}

const isLower = new RegExp('^[a-z0-9]')

const isEnvParsable = key => {
  return isLower.test(key)
}

const parseEnvArray = value => {
  return lodash(value.split(','))
    .map(x => x.trim())
    .compact()
    .value()
}

module.exports = env => {
  return lodash.reduce(
    env,
    (result, value, key) => {
      if (!isEnvParsable(key)) return result
      const path = key.split('.')
      let val = value
      if (isEnvArray(value)) {
        val = parseEnvArray(value)
      }
      lodash.set(result, path, val)
      return result
    },
    {}
  )
}

