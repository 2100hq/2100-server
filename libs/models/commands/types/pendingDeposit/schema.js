module.exports = config => {
  return {
    toAddress:{type:'string'},
    tokenid:'string',
    blockNumber:'number',
    confirmations:'number',
    toWalletType:{type:'string'},
    value:{type:'number',positive:true},
  }
}

