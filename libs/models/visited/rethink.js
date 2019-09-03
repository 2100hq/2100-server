const { Table } = require('../../utils').Rethink
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
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
    visited(id){
      return table.get(id)
        .then(result=>{
          return result.visited
        }) 
        .catch(err=>{
          return false
        })
    },
    ...table,
  }
}

