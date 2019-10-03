const Table = require('../../mongo/table')
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['done'],
    capped:true,
    size:536870912,
  }

  const table = await Table(con, schema)

  return {
    ...table,
    list(from=0){
      return table.getBy({},{skip:from}).toArray()
      // return table.run(table.table().orderBy('id').slice(from).coerceTo('array'))
    },
    getDone(done=false){
      return table.getBy({done})
    },
    async latestDone(done=true){
      const [result] = await table.query().find({done}).sort({_id:-1}).limit(1).toArray()
      return result
      // return table.run(
      //   table.table().getAll(done,{index:'done'}).max('id')
      // )
    },
    //get next unprocessed block
    async next(){
      const [next] = await table.query().find({done:false}).sort({_id:1}).limit(1).toArray()
      return next
      //return table.run(
      //  table.table().getAll(false,{index:'done'}).min('id')
      //).catch(err=>{
      //  //error probably no non done blocks, return null
      //})
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



