const assert = require('assert')

module.exports = (config,{query,commands,users,signer,coupons}) => {
  assert(query,'requires query model')
  assert(commands,'requires commands model')
  assert(users,'requires users model')
  assert(coupons,'requires coupons model')

  return user =>{
    assert(user,'You must be logged in')
    assert(user.isAdmin,'You must be an admin')

    async function createToken({name,ownerAddress}){
      assert(!(await query.hasPendingToken(name.toLowerCase())),'Token is already pending creation')
      assert(!(await coupons.create.has(name.toLowerCase())),'Coupon already exists')
      assert(ownerAddress,'requires owners address to create token')
      const data = {name,userid:user.id}
      data.ownerAddress = ownerAddress.toLowerCase()
      return commands.createType('createPendingToken',data)
    }

    async function setAdmin({userid,isAdmin}){
      assert(userid,'requires userid')
      assert(userid !== user.id,'You cannot change your admin status')
      return users.setAdmin(userid.toLowerCase(),isAdmin)
    }

    return {
      createToken,
      setAdmin,
    }
  }
}
