const Engines = require('../../engines')

module.exports = (config,libs,emit=x=>x)=>{
  return {
    // transactions:Engines.Transactions(config,libs),
    minting:Engines.Minting(config,libs),
    commands:{
      optimized:Engines.CommandsOptimized(config,libs),
      standard:Engines.Commands(config,libs),
    },
    eventlogs:Engines.EventLogs(config,libs),
    // blocks:Engines.Blocks(config,libs),
    blocks:Engines.BlocksV2(config,libs),
  }
}

