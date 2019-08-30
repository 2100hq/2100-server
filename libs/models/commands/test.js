require('dotenv').config()
const test = require('tape')
const Commands = require('./')
const Stateful = require('../stateful')
const highland = require('highland')
const lodash = require('lodash')

test('commands',t=>{
  let model
  t.test('model',t=>{
    t.test('init',t=>{
      model = Commands.Model({},Stateful.Model({},new Map()))
      t.ok(model)
      t.end()
    })
    // t.test('create transaction',async t=>{
    //   const result = await model.createType('transaction',{
    //     fromAddress:'test',
    //     toAddress:'test',
    //     tokenid:'test',
    //     fromWalletType:'test',
    //     toWalletType:'test',
    //     value:1,
    //     userid:'test',
    //   })
    //   console.log(result)
    //   t.ok(result)
    //   t.end()
    // })
  })
  t.test('mongo',t=>{
    const Mongo = require('../../mongo')
    const Table = require('./mongo')
    const config = require('../../parseEnv')(process.env)
    let con, mongo
    t.test('init',async t=>{
      con = await Mongo(config.mongo)
      // console.log(con)
      mongo = await Table({table:'test'},con).catch(t.end)
      t.end()
    })
    t.test('drop',async t=>{
      await mongo.drop()
      t.end()
    })
    t.test('fill',async t=>{
      const result = await highland(lodash.times(100))
        .map(i=>{
          return mongo.set(String(i),{
            id:String(i),
            userid:'testuser',
            type:'test',
            done:Math.random() > .1
          })
        })
        .flatMap(highland)
        .collect()
        .toPromise(Promise)
      t.equal(result.length,100)
      t.end()
    })
    t.test('getUserDone',async t=>{
      const result = await mongo.getUserDone('testuser',true,10,10)
      console.log(result)
      t.equal(result.length,10)
      t.end()
    })
  })
  // t.test('rethink',t=>{
  //   const {RethinkConnection} = require('../../utils')
  //   let con,rethink
  //   t.test('init',async t=>{
  //     con = await RethinkConnection({db:'test'})
  //     rethink = await Commands.Rethink({table:'test_commands'},con)
  //     t.ok(con)
  //     t.ok(rethink)
  //     t.end()
  //   })
  //   t.test('drop',async t=>{
  //     await rethink.drop()
  //     t.end()
  //   })
  //   t.test('fill',async t=>{
  //     const result = await highland(lodash.times(100))
  //       .map(i=>{
  //         return rethink.create({
  //           id:String(i),
  //           userid:'testuser',
  //           type:'test',
  //           done:Math.random() > .1
  //         })
  //       })
  //       .flatMap(highland)
  //       .collect()
  //       .toPromise(Promise)
  //     t.equal(result.length,100)
  //     t.end()
  //   })
  //   t.test('getUserDone',async t=>{
  //     const result = await rethink.getUserDone('testuser',true,0,10)
  //     t.equal(result.length,10)
  //     t.end()
  //   })
  //   t.test('close',t=>{
  //     con.close()
  //     t.end()
  //   })
  // })
})

