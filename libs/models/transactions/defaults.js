// const uuid = require('uuid/v4')
const {IncreasingId} = require('../../utils')
module.exports = () => {
  const id = IncreasingId()
  
  return (props = {}) => {
    return {
      id:id(),
      created:Date.now(),
      ...props
    }
  }
}

