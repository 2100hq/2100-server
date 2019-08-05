module.exports = config =>{
  return {
    tokenid:'string',
    minimumStake:{type:'string',numeric:true},
    reward:{type:'string',numeric:true},
    ownerShare:{type:'number'},
    ownerAddress:{type:'string'},
  }
}
