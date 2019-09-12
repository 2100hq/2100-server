const ethers = require('ethers')
const lodash = require('lodash')
const assert = require('assert')

module.exports = async (config,libs,emit=x=>x) => {
  // assert(config.provider.type,'requires provider type')


  // console.log({defaultStartBlock})
  // assert(defaultStartBlock,'requires starting block')


  let provider 
  if(config.provider.type){
    provider = new ethers.providers[config.provider.type](config.provider.url,config.provider.network)
  }else{
    provider = new ethers.getDefaultProvider()
  }


  // if(defaultStartBlock) provider.resetEventsBlock(defaultStartBlock)

  const decodeLog = (abi,meta={}) => {
    const iface = new ethers.utils.Interface(abi)
    return log => {
      return {
        ...iface.parseLog(log),
        ...meta,
      }
    }
  }

  provider.decodeLog = decodeLog
  provider.utils = ethers.utils

  provider.start = async (defaultStartBlock)=>{
    if(lodash.isFinite(defaultStartBlock)){
      const currentBlockNumber = (await provider.getBlockNumber() + 1)
      console.log(defaultStartBlock,currentBlockNumber)
      lodash.times(currentBlockNumber-defaultStartBlock,index=>{
        const number = index + defaultStartBlock
        emit('block',number)
      })
    }

    provider.on('block',x=>emit('block',x))

  }

  return provider

}

