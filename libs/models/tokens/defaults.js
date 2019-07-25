const assert = require('assert')
module.exports = (config={}) => {
  assert(config.supply,'requires default token supply in wei')
  assert(config.ownerShare,'requires default token ownerShare (0-1)')
  assert(config.creatorReward,'requires default token creatorReward in wei')
  assert(config.ownerAddress,'requires default token ownerAddress')
  assert(config.reward,'requires default token block reward in wei')

  return (props = {}) => {
    return {
      id:props.contractAddress,
      supply:config.supply,
      ownerShare:config.ownerShare,
      creatorReward:config.creatorReward,
      ownerAddress:config.ownerAddress,
      reward:config.reward,
      ...props
    }
  }
}

