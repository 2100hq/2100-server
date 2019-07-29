const assert = require('assert')
module.exports = (config={}) => {
  return (props = {}) => {
    return {
      created:Date.now(),
      ...props
    }
  }
}

