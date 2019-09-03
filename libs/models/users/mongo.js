const Table = require('../../mongo/table')
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
    async getByUsername(username){
      assert(username,'requries username')
      const result = await table.getBy({username}).toArray()
      assert(result.length,'no user with username: ' + username)
      return result[0]
    },
    ...table
  }
}
