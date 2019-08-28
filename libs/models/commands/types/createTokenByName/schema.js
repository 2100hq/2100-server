const {regexTwitter,regexLowerNum,regexAddress}  = require('../../../../utils')
module.exports = () => {
  return {
    name:{type:'string',pattern:regexTwitter},
    creatorAddress:{type:'string',pattern:regexAddress},
    ownerAddress:{type:'string',pattern:regexAddress},
  }
}



