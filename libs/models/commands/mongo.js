const assert = require('assert')
const Table = require('../../mongo/table')
const highland = require('highland')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['type','done'],
    compound:[
      {name:'typeDone',fields:['type','done']},
      {name:'userDone',fields:['userid','done']}
    ],
    // capped:true,
    size:4294967296,
  }

  const table = await Table(con, schema)

  function getDone(done=false){
    return table.getBy({done})
  }

  function getUserDone(userid,done=false,start=0,length,desc=true){
    return table.getBy({userid,done},{skip:start,limit:length})
  }

  function getTypeDone(type,done=false){
      assert(type,'requires command type')
      return table.getBy('typeDone',[type,done])
  }
  function countDone(done=false){
    return table.count({done})
  }
  function readStream(done=false){
    return table.readStream({done})
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
    getDone,
    getUserDone,
    getTypeDone,
    countDone,
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

