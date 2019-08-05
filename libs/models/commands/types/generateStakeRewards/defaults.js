module.exports = config => {
  return props =>{ 
    return {
      minimum:'1',
      ...props
    }
  }
}
