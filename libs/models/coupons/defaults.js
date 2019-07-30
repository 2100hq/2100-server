const {blockid} = require('../../utils')


module.exports = () => {
  return (props = {}) => {
    return {
      done:false,
      ...props
    }
  }
}

