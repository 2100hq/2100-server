module.exports = () => {
  return {
    id: 'string',
    name:'string',
    supply:'number',
    ownerShare:{type:'number',max:1,min:0},
    reward:'number',
    createdBlock:'number',
  }
}


