const {blockid} = require('../../utils')


module.exports = () => {
  return (props = {}) => {
    return {
      id:blockid(props.number),
      done:false,
      ...props
    }
  }
}

