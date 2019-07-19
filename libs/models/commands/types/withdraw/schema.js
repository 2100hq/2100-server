module.exports = config => {
  return {
    fromAddress:{type:'string'},
    fromWalletType:{type:'string'},
    tokenid:'string',
    value:{type:'number',positive:true},
  }
}


