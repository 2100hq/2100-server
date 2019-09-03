const Table = require('../../mongo/table')
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
    list(from=0){
      return table.query().find({},{skip:from})
    },
    byUser(userid){
      return table.getBy({userid})
    },
    getDone(done=false){
      return table.getBy({done})
    },
    async latest(){
      const [last] = await table.query().find().sort({_id:-1}).limit(1).toArray()
      return last
    }
  }
}



