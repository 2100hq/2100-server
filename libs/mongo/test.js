require('dotenv').config()
const config = require('../parseEnv')(process.env)
const test = require('tape')
const Mongo = require('./')
const Table = require('./table')

const schema = {
  table: 'test',
  indices:['type','done'],
  compound:[
    {name:'typeDone',fields:['type','done']},
    {name:'userDone',fields:['userid','done']}
  ]
}

test('mongo',t=>{
  let table,db
  t.test('init',async t=>{
    db = await Mongo(config.mongo)
    t.ok(db)
    table = await Table(db,schema)
    t.ok(table)
    t.end()
  })
  t.test('set',async t=>{
    const result = await table.set('test',{
      id:'test',
    })
    console.log(result)
    t.end()
  })
  t.test('get',async t=>{
    const result = await table.get('test')
    console.log(result)
    t.end()
  })
})


