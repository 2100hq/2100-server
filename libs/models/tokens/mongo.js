const Table = require('../../mongo/table')
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
    getByOwner(ownerAddress){
      return table.getBy({ownerAddress})
    },
    getByName(name){
      assert(name,'requires token name')
      return table.getBy({name})
    },
    hasAll(ids=[]){
      // console.log('has',ids)
      return Promise.reduce(ids,async (result,id)=>{
        if(result === false){
          return result
        }
        const res = await table.has(id)
        // if(!res){
          // console.log('none',id)
        // }
        return res
      },true)
    }

  }
}



