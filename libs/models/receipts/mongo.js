const assert = require('assert')
const Table = require('../../mongo/table')
const highland = require('highland')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['userid'],
    capped:true,
    size:4294967296,
  }

  const table = await Table(con, schema)

  async function readStream(done=false){
    return highland(await table.getBy({done}))
    // return table.streamify(table.getAll({done}))
    // const query = table.table().getAll(done,{index:'done'})
    // return table.streamify(query)
  }
  function insert(many){
    return table.insertMany(many)
    // console.log('many',many.length)
    // const query = table.table().insert(many,{return_changes:false,conflict:'error'})
    // return table.run(query)
  }

  return {
    ...table,
    readStream,
    insert,
  }

  // const table = {
  //   get (id) {
  //     assert(id, 'requires id')
  //     return con.findOne({
  //       _id: id
  //     })
  //   },
  //   async set (id, obj) {
  //     obj._id = id
  //     await con.updateOne({ _id: id }, { $set: obj }, { upsert: true })
  //     return obj
  //   },
  //   async has (id) {
  //     return Boolean(
  //       await con.findOne({
  //         _id: id
  //       })
  //     )
  //   },
  //   async delete (id) {
  //     await con.deleteOne({ _id: id })
  //     return { _id: id, id }
  //   },
  //   getDone (done = false) {
  //     return con.find({ done }).toArray()
  //   },
  //   getByOwner (ownerid) {
  //     return con.find({ ownerid }).toArray()
  //   },
  //   list () {
  //     return con.find({}).toArray()
  //   }
  // }

  // return table
}

