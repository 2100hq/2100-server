const assert = require('assert')
const bn = require('bignumber.js')

//keep this simple for now
module.exports = (config,{commands,tokens})=>{
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  return {
    async Start(cmd){
      if(await tokens.pending.has(cmd.name)){
        return commands.failure(cmd.id,'Token is already pending')
      }
      return commands.setState(cmd.id,'Create Pending Token')
    },
    //this can only happen once, create will throw if anything already exists
    //this assume the commands initilalized with all valid numbers.
    async 'Create Pending Token'(cmd){
      //create token
      const token = await tokens.pending.create({
        id:cmd.name,
        name:cmd.name,
      })

      return commands.success(cmd.id,'Token Created Pending Confirmation')
    }
  }
}



