module.exports = config =>{
  return props =>{
    return {
      toWalletType:'locked',
      ...props
    }
  }
}
