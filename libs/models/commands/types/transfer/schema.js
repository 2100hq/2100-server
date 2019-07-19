module.exports = config => {
  return {
    fromAddress:{type:'string'},
    toAddress:{type:'string'},
    tokenid:'string',
    fromWalletType:{type:'string'},
    toWalletType:{type:'string'},
    value:{type:'number',positive:true},
    // fromAddress:{type:'string',optional:true},
    // toAddress:{type:'string',optional:true},
    // tokenid:'string',
    // fromWalletType:{type:'string',optional:true},
    // toWalletType:{type:'string',optional:true},
    // value:{type:'number',positive:true},
  }
}
