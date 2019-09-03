const Table = require('../../mongo/table')
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices: ['tokenid','userid'],
  }

  const table = await Table(con, schema)

  return {
    ...table,
    getByToken(tokenid){
      assert(tokenid,'requires tokenid')
      return table.getBy({tokenid})
    },
    getByUser(userid){
      assert(userid,'requires userid')
      return table.getBy({userid})
    }
  }
}



