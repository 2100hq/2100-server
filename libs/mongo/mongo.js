const assert = require('assert')
const mongo = require('mongodb')
module.exports = async config => {
  assert(config.uri, 'requires dburi')
  const db = (await mongo.connect(config.uri, {retryWrites:false, useNewUrlParser: true })).db()
  return db
}


