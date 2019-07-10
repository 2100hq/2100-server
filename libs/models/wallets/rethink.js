const { Table } = require('../../utils').Rethink
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
    set(id,data){
      return table.upsert(data)
    },
    getByToken(id){
      assert(id,'requires tokenid')
      return table.getBy('tokenid',id)
    },
    getByUser(id){
      assert(id,'requires userid')
      return table.getBy('userid',id)
    }
  }
}



