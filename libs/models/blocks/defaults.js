const {blockid} = require('../../utils')


module.exports = () => {
  return (props = {}) => {
    // console.log('defaults',props)
    return {
      id:blockid(props.number),
      done:false,
      ...props
    }
  }
}

