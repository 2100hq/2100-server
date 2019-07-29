const assert = require('assert')
module.exports = (config={}) =>{
  assert(config.tokens,'requires token defaults')
  return props =>{
    return {
      ...config.tokens,
      ...props
    }
  }
}
