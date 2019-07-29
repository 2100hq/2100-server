const assert = require('assert')
module.exports = (config={}) => {
  assert(config.supply,'requires default token supply in eth')
  assert(config.ownerShare,'requires default token ownerShare (0-1)')
  assert(config.creatorReward,'requires default token creatorReward in eth')
  assert(config.ownerAddress,'requires default token ownerAddress')
  assert(config.reward,'requires default token block reward in eth')
  assert(config.decimals,'requires default token decimals')

  return (props = {}) => {
    return {
      id:props.contractAddress,
      supply:config.supply,
      ownerShare:config.ownerShare,
      creatorReward:config.creatorReward,
      ownerAddress:config.ownerAddress,
      reward:config.reward,
      decimals:config.decimals,
      created:Date.now(),
      ...props
    }
  }
}

