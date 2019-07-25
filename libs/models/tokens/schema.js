const bn = require('bignumber.js')
const assert = require('assert')
module.exports = () => {
  return {
    id: 'string',
    contractAddress:'string',
    name:{type:'string',optional:true},
    supply:'string',
    ownerShare:{type:'number',max:1,min:0},
    ownerAddress:'string',
    creatorAddress:'string',
    creatorReward:'string',
    reward:'string',
    createdBlock:'number',
  }
}


