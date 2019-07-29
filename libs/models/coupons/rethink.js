const { Table } = require('../../utils').Rethink
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['userid','done'],
  }

  const table = await Table(con, schema)

  return {
    ...table,
    set(id,data){
      return table.upsert(data)
    },
    list(from=0){
      return table.run(table.table().orderBy('id').slice(from).coerceTo('array'))
    },
    byUser(userid){
      return table.getBy('userid',userid)
    },
    getDone(done=false){
      return table.getBy('done',done)
    },
    latest(){
      const query = table.table().max({index:'id'})
      return table.run(query).catch(err=>{
        // console.log('block error',err)
        //no entries
        return null
      })
    }
  }
}



