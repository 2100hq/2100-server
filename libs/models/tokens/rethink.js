const { Table } = require('../../utils').Rethink
const Promise = require('bluebird')
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['name','ownerAddress']
  }

  const table = await Table(con, schema)

  return {
    ...table,
    set(id,data){
      return table.upsert(data)
    },
    getByOwner(ownerAddress){
      return table.getBy('ownerAddress',ownerAddress)
    },
    getByName(name){
      assert(name,'requires token name')
      return table.getBy('name',name)
    },
    hasAll(ids=[]){
      return Promise.reduce(ids,async (result,id)=>{
        if(result === false){
          return result
        }
        const res = await table.has(id)
        // if(!res){
        //   console.log('none',id)
        // }
        return res
      },true)
    }

  }
}



