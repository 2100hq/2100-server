const Table = require('../../mongo/table')
const assert = require('assert')
const highland = require('highland')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['name','done'],
    capped:true,
    size:1073741824,
  }

  const table = await Table(con, schema)

  return {
    ...table,
    getDone(done=false){
      return table.getBy({done})
    },
    list(from){
      return table.getBy({},{skip:from})
    },
    readStream(done=false){
      return highland(table.query().find({done}))
    },
    async latest(){
      const [latest] = await table.query().find().sort({_id:-1}).limit(1).toArray()
      return latest
    },
    async insert(many=[]){
      if(many.length ==0) return []
      return table.insertMany(many)
    }
  }
}



