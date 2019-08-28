const {regexTwitter,regexLowerNum, regexAddress,regexLowerUrl}  = require('../../utils')
module.exports = () => {
  return {
    id: {type:'string',pattern:regexLowerUrl},
    contractAddress:{type:'string',pattern:regexAddress,optional:true},
    name:{type:'string',pattern:regexTwitter},
    supply:{type:'string',numeric:true},
    minimumStake:{type:'string',numeric:true},
    decimals:{type:'number',min:0,max:18},
    ownerShare:{type:'number',max:1,min:0},
    ownerAddress:{type:'string',pattern:regexAddress},
    creatorAddress:{type:'string',pattern:regexAddress},
    creatorReward:{type:'string',numeric:true},
    reward:{type:'string',numeric:true},
    minimumStake:{type:'string',numeric:true},
    createdBlock:'number',
    description:{type:'string',optional:true},
  }
}


