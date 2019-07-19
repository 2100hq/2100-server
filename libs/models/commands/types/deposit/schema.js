module.exports = config => {
  return {
    toAddress:{type:'string'},
    tokenid:'string',
    toWalletType:{type:'string'},
    value:{type:'number',positive:true},
  }
}

