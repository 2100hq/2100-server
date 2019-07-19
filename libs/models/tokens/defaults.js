const uuid = require('uuid/v4')
module.exports = () => {
  return (props = {}) => {
    return {
      id:props.name,
      supply:2100,
      reward:.0021,
      ownerAddress:'owner',
      ...props
    }
  }
}

