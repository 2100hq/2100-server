const {IncreasingId} = require('../../utils')
module.exports = config =>{
  const id = IncreasingId()
  return props => {
    return {
      id: id(),
      userid:'default',
      ...props
    }
  }
}
