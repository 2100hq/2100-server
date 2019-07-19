const assert = require('assert')
module.exports = (config, con) => {
  const table = {
    get (id) {
      assert(id, 'requires id')
      return con.findOne({
        _id: id
      })
    },
    async set (id, obj) {
      obj._id = id
      await con.updateOne({ _id: id }, { $set: obj }, { upsert: true })
      return obj
    },
    async has (id) {
      return Boolean(
        await con.findOne({
          _id: id
        })
      )
    },
    async delete (id) {
      await con.deleteOne({ _id: id })
      return { _id: id, id }
    },
    getDone (done = false) {
      return con.find({ done }).toArray()
    },
    getByOwner (ownerid) {
      return con.find({ ownerid }).toArray()
    },
    list () {
      return con.find({}).toArray()
    }
  }

  return table
}
