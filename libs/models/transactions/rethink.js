const { Table } = require('../../utils').Rethink
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['to','from'],
  }

  const table = await Table(con, schema)

  return {
    ...table,
    set(id,data){
      return table.upsert(data)
    },
    byToUser(userid){
      return table.getBy('to',userid)
    },
    byFromUser(userid){
      return table.getBy('from',userid)
    }
  }
}



