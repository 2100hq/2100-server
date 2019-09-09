module.exports = config => {
  return {
    toAddress:{type:'string'},
    tokenid:'string',
    toWalletType:{type:'string'},
    value:{type:'string',number:true,positive:true},
  }
}

