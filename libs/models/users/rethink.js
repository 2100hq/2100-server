const { Table } = require('../../utils').Rethink
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices: ['username'],
  }

  const table = await Table(con, schema)

  // table.getByUser = userid => {
  //   assert(userid, 'requires userid')
  //   return table.getBy('userid', userid)
  // }

  return {
    set(id,props){
      return table.upsert(props)
    },
    async getByUsername(username){
      const result = await table.getBy('username',username)
      console.log('getbyusername',result)
      assert(result.length,'no user with username: ' + username)
      return result[0]
    },
    ...table
  }
}
