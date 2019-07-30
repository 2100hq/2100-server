const assert = require('assert')

module.exports = (config,{query,commands,users,signer}) => {
  assert(query,'requires query model')
  assert(commands,'requires commands model')
  assert(users,'requires users model')

  return user =>{
    assert(user,'You must be logged in')
    assert(user.isAdmin,'You must be an admin')

    // async function createToken({name}){
    //   assert(name,'requires a token name')
    //   const latest = await libs.blocks.latest()
    //   const result = await libs.tokens.create({id:name,name,createdBlock:latest.number})
    //   await libs.stakes.create({id:name})
    //   await libs.addWallet(name)
    //   return result
    // }

    //adds owner address
    async function createTokenWithOwner({name,signature}){
      assert(name,'requires token name')
      assert(signature,'requires signed message')
      const ownerAddress = (await signer.verifyMessage(name,signature)).toLowerCase()
      assert(ownerAddress,'requires an owner address derived from signature')
      assert(!(await query.hasPendingToken(name.toLowerCase())),'Token is already pending creation')
      return commands.createType('createPendingToken',{name,userid:user.id,ownerAddress})
    }

    async function createToken({name}){
      assert(!(await query.hasPendingToken(name.toLowerCase())),'Token is already pending creation')
      return commands.createType('createPendingToken',{name,userid:user.id,ownerAddress})
    }

    async function setAdmin({userid,isAdmin}){
      assert(userid !== user.id,'You cannot change your admin status')
      return users.setAdmin(userid,isAdmin)
    }

    return {
      createToken,
      createTokenWithOwner,
      setAdmin,
    }
  }
}
