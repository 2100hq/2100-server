const {IncreasingId} = require('../../utils')
module.exports = config =>{
  const id = IncreasingId()
  return props => {
    return {
      id: id(),
      created:Date.now(),
      ...props,
      updated:Date.now(),
    }
  }
}
