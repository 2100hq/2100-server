const CommandTypes = require('../../models/commands/types')

module.exports = (config,libs,emit=x=>x)=>{
  const {commandTypes=[]} = config

  return commandTypes.reduce((result,type)=>{
    result[type] = CommandTypes(type).Handler(config,libs,emit)
    return result
  },{})
}


