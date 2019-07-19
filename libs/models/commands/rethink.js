const { Table } = require('../../utils').Rethink
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['type','done'],
    compound:[
      {name:'typeDone',fields:['type','done']}
    ]
  }

  const table = await Table(con, schema)

  return {
    ...table,
    set(id,data){
      return table.upsert(data)
    },
    getDone(done=false){
      return table.getBy('done',done)
    },
    getTypeDone(type,done=false){
      assert(type,'requires command type')
      return table.getBy('typeDone',[type,done])
    }
  }
}




