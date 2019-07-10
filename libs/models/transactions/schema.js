module.exports = () => {
  return {
    id: 'string',
    userid:'string',
    from:'string',
    to:'string',
    type:'string',
    tokenid:'string',
    value:'number',
    error:{type:'object',optional:true,props:{message:'string',stack:'string'}},
    updated:'number',
  }
}


