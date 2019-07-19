const {eventid} = require('../../utils')


module.exports = () => {
  return (props = {}) => {
    return {
      id:eventid(props.contractAddress,props.blockNumber,props.index),
      created:Date.now(),
      done:false,
      ...props
    }
  }
}

