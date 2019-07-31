const assert = require('assert')

module.exports = (config,{query,commands,users,signer}) => {
  assert(query,'requires query model')
  assert(commands,'requires commands model')
  assert(users,'requires users model')

  return user =>{
    assert(user,'You must be logged in')
    assert(user.isAdmin,'You must be an admin')

    async function createToken({name,ownerAddress}){
      assert(!(await query.hasPendingToken(name.toLowerCase())),'Token is already pending creation')
      const data = {name,userid:user.id}
      if (ownerAddress) data.ownerAddress = ownerAddress.toLowerCase()
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
