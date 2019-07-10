const test = require('tape')
const Events = require('events')
const Wallets = require('../../models/wallets')

const Tokens = require('../../models/tokens')
const Stakes = require('../../models/stakes')
const Transactions = require('../../models/transactions')
const Blocks = require('../../models/blocks')
const Users = require('../../models/users')
const Joins = require('../../models/joins')
const Queries = require('../../models/queries')

const CacheModels = require('./models-cache')
const Actions = require('./actions')
const ApiEvents = require('../../models/events')

test('2100',t=>{
  t.test('logic',t=>{
    let logic, libs, actions,engines,config
    const events = new Events()

    t.test('init libs',async t=>{
      libs = await CacheModels(config,{},(...args)=>events.emit('models',args))
      t.ok(libs)
      t.end()
    })
    t.test('init joins/query',async t=>{
      libs.joins = await Joins(config,libs)
      libs.query = await Queries(config,libs)
      t.ok(libs.joins)
      t.ok(libs.query)
      t.end()
    })
    t.test('init events',async t=>{
      libs.events = await ApiEvents({},libs,(...args)=>events.emit('api',args))
      t.ok(libs.events)
      t.end()
    })
    t.test('init actions',async t=>{
      libs.actions = await Actions({},libs)
      t.ok(libs.actions)
      t.end()
    })
    t.test('echo',async t=>{
      const result = await libs.actions.public(undefined,'echo','test')
      t.equal(result,'test')
      t.end()
    })
    t.test('login',async t=>{
      events.once('models',(...args)=>{
        console.log('event',...args)
      })
      const result = await libs.actions.auth(undefined,'login',{username:'test'})
      console.log(result)
      t.ok(result)
      t.end()
    })
    // t.test('tick',async t=>{
    //   events.once('change',(...args)=>{
    //     console.log('event',...args)
    //   })
    //   let result = await logic.engine.tick().catch(t.end)
    //   t.ok(result)
    //   result = await logic.engine.tick().catch(t.end)
    //   t.ok(result)
    //   t.end()
    // })
    t.test('createToken',async t=>{
      const result = await logic.actions.admin().createToken({name:'test'})
      t.ok(result)
      t.end()
    })
    // t.test('faucet',async t=>{
    //   const [user] = await logic.queries.listUsers()
    //   const result = await logic.actions.private(user).faucet()
    //   t.end()
    // })

    // t.test('stake token',async t=>{
    //   const [token] = await logic.queries.listTokens()
    //   const [user] = await logic.queries.listUsers()
    //   t.ok(token)
    //   t.ok(user)
    //   const result = await logic.actions.private(user).stake({token:'test',amount:10})
    //   console.log(result)
    //   t.end()
    // })
    // t.test('tick',async t=>{
    //   let result = await logic.engine.tick().catch(t.end)
    //   console.log(result)
    //   t.end()
    // })
    // t.test('checkb balance',async t=>{
    //   const [user] = await logic.queries.listUsers()
    //   const result = await logic.queries.getBalance('test',user.id)
    //   console.log(result)
    //   t.end()
    // })
    // t.test('unstake',async t=>{
    //   const [user] = await logic.queries.listUsers()
    //   const result = await logic.actions.private(user).unstake({token:'test',amount:10})
    //   console.log(result)
    //   t.end()
    // })
  })
})
