const {regexTwitter,regexLowerNum,regexAddress}  = require('../../../../utils')
module.exports = () => {
  return {
    contractAddress:{type:'string',pattern:regexAddress},
    name:{type:'string',pattern:regexTwitter},
    supply:{type:'string',numeric:true},
    decimals:{type:'number',min:0,max:18},
    ownerShare:{type:'number',max:1,min:0},
    creatorAddress:{type:'string',pattern:regexAddress},
    creatorReward:{type:'string',numeric:true},
    reward:{type:'string',numeric:true},
    createdBlock:'number',
    minimumStake:{type:'string',numeric:true},
    transactionHash:'string',
  }
}



