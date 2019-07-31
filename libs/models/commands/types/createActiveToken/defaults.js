const assert = require('assert')
module.exports = (config={}) =>{
  assert(config.tokens,'requires token defaults')
  return props =>{
    return {
      supply:config.tokens.supply,
      ownerShare:Number(config.tokens.ownerShare),
      creatorReward:config.tokens.creatorReward,
      ownerAddress:config.tokens.ownerAddress,
      reward:config.tokens.reward,
      decimals:Number(config.tokens.decimals),
      created:Date.now(),
      ...props
    }
  }
}
