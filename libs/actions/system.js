const assert = require('assert')

module.exports = (config,{users,getWallets}) => {
  assert(users,'requires users model')
  assert(getWallets,'requires getWallets')

  const {primaryToken} = config
  assert(primaryToken,'requires primary token')

  return user =>{
    assert(user,'You must be logged in')

    async function setAdmin({userid,isAdmin}){
      assert(userid,'requires userid')
      // assert(userid !== user.id,'You cannot change your admin status')
      return users.setAdmin(userid.toLowerCase(),isAdmin)
    }

    //testing only
    async function gift(userid,amount){
      const wallets = getWallets('available')
      await wallets.getOrCreate(userid,primaryToken)
      return wallets.deposit(userid,primaryToken,amount)
    }

    return {
      setAdmin,
      gift,
    }
  }
}

