const ethers = require('ethers')
const assert = require('assert')

module.exports = async (config,{},emit=x=>x) => {
  const {defaultStartBlock} = config
  assert(config.provider.type,'requires provider type')


  // assert(defaultStartBlock,'requires starting block')

  const provider = new ethers.providers[config.provider.type](config.provider.url,config.provider.network)

  if(defaultStartBlock) provider.resetEventsBlock(defaultStartBlock)

  provider.on('block',x=>emit('block',x))

  const decodeLog = (abi,meta={}) => {
    const iface = new ethers.utils.Interface(abi)
    return log => {
      return {
        ...meta,
        ...iface.parseLog(log)
      }
    }
  }

  provider.decodeLog = decodeLog
  provider.utils = ethers.utils

  return provider

}

