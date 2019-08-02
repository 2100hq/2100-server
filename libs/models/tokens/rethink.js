const { Table } = require('../../utils').Rethink
const Promise = require('bluebird')
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['name']
  }

  const table = await Table(con, schema)

  return {
    ...table,
    set(id,data){
      return table.upsert(data)
    },
    getByName(name){
      assert(name,'requires token name')
      return table.getBy('name',name)
    },
    hasAll(ids=[]){
      return Promise.reduce(ids,(result,id)=>{
        if(result === false) return result
        return table.has(id)
      },true)
    }

  }
}



