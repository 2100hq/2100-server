const {walletId} = require('../../utils')
module.exports = () => {
  return (props = {}) => {
    return {
      id:walletId(props.userid,props.tokenid),
      balance:'0',
      updated:Date.now(),
      ...props
    }
  }
}

