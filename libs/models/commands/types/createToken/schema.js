module.exports = () => {
  return {
    contractAddress: 'string',
    name:'string',
    supply:'number',
    ownerShare:{type:'number',max:1,min:0},
    ownerAddress:'string',
    creatorAddress:'string',
    creatorReward:'string',
    reward:'number',
    createdBlock:'number',
  }
}



