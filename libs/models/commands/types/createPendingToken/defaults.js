const assert = require('assert')
module.exports = (config={}) =>{
  console.log(config)
  assert(config.tokens,'requires token defaults')
  return props =>{
    return {
      ...props
    }
  }
}
