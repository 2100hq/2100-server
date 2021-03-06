const Table = require('../../mongo/table')
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    indices:['created'],
    ...config,
  }

  const table = await Table(con, schema)

  return {
    ...table,
    list(from=0){
      return table.getBy({},{skip:from}).toArray()
      // return table.run(table.table().orderBy('id').slice(from).coerceTo('array'))
    },
    between(start,end){
      console.log({start,end})
      return table.query().find({
        _id:{
          $gte:start,
          $lt:end
        }
      }).toArray()
    },
    betweenTime(start,end){
      console.log('betweentime',start,end)
      return table.query().find({
        created:{
          $gte:start,
          $lt:end
        }
      }).toArray()
    },
    async latest(){
      const [last] = await table.query().find().sort({_id:-1}).limit(1).toArray()
      return last
      //// return table.run(
      //const query = table.table().max({index:'id'})
      //return table.run(query).catch(err=>{
      //  // console.log('block error',err)
      //  //no entries
      //  return null
      // })
    }
  }
}



