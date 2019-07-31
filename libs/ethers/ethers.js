const ethers = require('ethers')
const assert = require('assert')

module.exports = async (config,{},emit=x=>x) => {
  const {defaultStartBlock} = config
  assert(config.provider.type,'requires provider type')


  console.log({defaultStartBlock})
  // assert(defaultStartBlock,'requires starting block')

  const provider = new ethers.providers[config.provider.type](config.provider.url,config.provider.network)

  if(defaultStartBlock) provider.resetEventsBlock(defaultStartBlock)

  provider.on('block',x=>emit('block',x))

  const decodeLog = (abi,meta={}) => {
    const iface = new ethers.utils.Interface(abi)
    return log => {
      return {
        ...iface.parseLog(log),
        ...meta,
      }
    }
  }

  function signData(hash){
  }

  function verifySignature(hash){
  }

  provider.decodeLog = decodeLog
  provider.utils = ethers.utils

  return provider

}

