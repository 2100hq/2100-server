const {regexTwitter,regexLowerNum}  = require('../../../../utils')
module.exports = () => {
  return {
    name:{type:'string',pattern:regexTwitter},
  }
}



