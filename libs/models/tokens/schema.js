const {regexTwitter,regexLowerNum}  = require('../../utils')
module.exports = () => {
  return {
    id: {type:'string',pattern:regexLowerNum},
    contractAddress:{type:'string',pattern:regexLowerNum},
    name:{type:'string',pattern:regexTwitter},
    supply:{type:'string',numeric:true},
    decimals:{type:'number',min:0,max:18},
    ownerShare:{type:'number',max:1,min:0},
    ownerAddress:{type:'string',pattern:regexLowerNum},
    creatorAddress:{type:'string',pattern:regexLowerNum},
    creatorReward:{type:'string',numeric:true},
    reward:{type:'string',numeric:true},
    createdBlock:'number',
  }
}


