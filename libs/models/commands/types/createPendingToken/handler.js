const assert = require('assert')
const bn = require('bignumber.js')

//keep this simple for now
module.exports = (config,{commands,tokens,signer,coupons})=>{
  assert(commands,'requires commands')
  assert(tokens,'requires tokens')
  assert(signer,'requires signer')
  assert(coupons,'requires coupons')
  assert(coupons.create,'requires creat token coupons')
  return {
    async Start(cmd){
      if(await tokens.pending.has(cmd.name)){
        return commands.failure(cmd.id,'Token is already pending')
      }
      return commands.setState(cmd.id,'Sign Create Coupon')
    },
    async 'Sign Create Coupon'(cmd){
      const messageId = await signer.createTokenMessage(cmd.name)
      const { v, r, s } = await signer.sign(messageId)
      const data = { symbol: cmd.name, messageId, v, r, s }

      const coupon = await coupons.create.create({
        id:cmd.name,
        data,
        userid:cmd.userid,
        name:cmd.name,
        description:`Submit to chain to create 2100 for @${cmd.name}`
      })

      return commands.setState(cmd.id,'Create Pending Token')
    },
    //this can only happen once, create will throw if anything already exists
    //this assume the commands initilalized with all valid numbers.
    async 'Create Pending Token'(cmd){
      //create token
      const token = await tokens.pending.create({
        id:cmd.name,
        name:cmd.name,
        ownerAddress:cmd.ownerAddress || null,
      })

      return commands.success(cmd.id,'Token Created Pending Confirmation')
    }
  }
}



