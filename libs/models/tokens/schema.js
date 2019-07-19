module.exports = () => {
  return {
    id: 'string',
    name:'string',
    supply:'number',
    ownerShare:{type:'number',max:1,min:0},
    ownerAddress:'string',
    reward:'number',
    createdBlock:'number',
  }
}


