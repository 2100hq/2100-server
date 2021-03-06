const assert = require('assert')

module.exports = (config,{query,commands,users,signer,coupons,blocks,tokens}) => {
  assert(query,'requires query model')
  assert(commands,'requires commands model')
  assert(users,'requires users model')
  assert(blocks,'requires blocks')
  assert(coupons,'requires coupons model')
  assert(tokens,'requires tokens model')

  return user =>{
    assert(user,'You must be logged in')
    assert(user.isAdmin,'You must be an admin')

    async function createPendingToken({name,ownerAddress}){
      assert(!(await query.hasPendingToken(name.toLowerCase())),'Token is already pending creation')
      assert(!(await coupons.create.has(name.toLowerCase())),'Coupon already exists')
      assert(!(await query.hasActiveTokenByName(name.toLowerCase())),'Token is already active')

      assert(ownerAddress,'requires owners address to create token')
      const {number} = await blocks.latest()
      const data = {name,userid:user.id,blockNumber:number}
      data.ownerAddress = ownerAddress.toLowerCase()
      return commands.createType('createPendingToken',data)
    }

    async function setAdmin({userid,isAdmin}){
      assert(userid,'requires userid')
      assert(userid !== user.id,'You cannot change your admin status')
      return users.setAdmin(userid.toLowerCase(),isAdmin)
    }

    //set a token description
    async function setTokenDescription(tokenid,description=''){
      return tokens.active.setDescription(tokenid,description)
    }

    async function createTokenByName(props){
      assert(props.ownerAddress, 'Requires ownerAddress')
      assert(!(await query.hasActiveTokenByName(props.name.toLowerCase())),'Token is already active')
      const owns = await tokens.active.getByOwner(props.ownerAddress)
      assert(owns.length === 0,`${props.ownerAddress} owns a token already`)
      props.userid = user.id
      props.name = props.name.toLowerCase()
      return commands.createType('createTokenByName',props)
    }

    return {
      createTokenByName,
      setTokenDescription,
      setAdmin,
      createPendingToken,
    }
  }
}
