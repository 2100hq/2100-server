module.exports = () => {
  return {
    id: 'string',
    blockNumber:'number',
    index:'number',
    blockHash:'string',
    contractName:{type:'string',optional:true},
    contractAddress:{type:'string'},
    transactionHash:'string',
    name:'string',
    signature:{type:'string',optional:true},
    topic:'string',
    values:'object',
    done:'boolean',
  }
}


