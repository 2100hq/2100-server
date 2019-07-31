const {regexTwitter}  = require('../../utils')
module.exports = () => {
  return {
    id: {type:'string',pattern:regexTwitter},
    couponid: {type:'string'},
    name:{type:'string',pattern:regexTwitter},
  }
}
