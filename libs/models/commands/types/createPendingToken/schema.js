const {regexTwitter,regexAddress}  = require('../../../../utils')
module.exports = () => {
  return {
    name:{type:'string',pattern:regexTwitter},
    ownerAddress:{type:'string',pattern:regexAddress},
  }
}



