module.exports = type =>{
  const path = './' + type
  return {
    Defaults:require(path + '/defaults'),
    Schema:require(path + '/schema'),
    Handler:require(path + '/handler'),
  }
}
