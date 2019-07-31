const assert = require('assert')

module.exports = (config,{users}) => {
  assert(users,'requires users model')

  return user =>{
    assert(user,'You must be logged in')

    async function setAdmin({userid,isAdmin}){
      assert(userid,'requires userid')
      // assert(userid !== user.id,'You cannot change your admin status')
      return users.setAdmin(userid.toLowerCase(),isAdmin)
    }

    return {
      setAdmin,
    }
  }
}

