const {regexTwitter}  = require('../../utils')
module.exports = () => {
  return {
    id: {type:'string',pattern:regexTwitter},
    name:{type:'string',pattern:regexTwitter},
  }
}
