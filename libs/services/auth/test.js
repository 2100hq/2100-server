const test = require('tape')
const Service = require('.')

test('auth',t=>{
  let service,tokenid
  t.test('init',async t=>{
    service = await Service({
      socket:{
        port:3724
      }
    })
    t.ok(service)
    t.end()
  })
  t.test('actions',t=>{
    t.test('token',async t=>{
      tokenid = await service.actions('token')
      console.log(tokenid)
      t.ok(tokenid)
      t.end()
    })
    t.test('user',async t=>{
      const result  = await service.actions('user',tokenid)
      t.notOk(result)
      t.end()
    })
    t.test('login',async t=>{
      const result  = await service.actions('login',tokenid,'test')
      t.ok(result)
      t.end()
    })
    t.test('user',async t=>{
      const result  = await service.actions('user',tokenid)
      t.equal(result,'test')
      t.end()
    })
    t.test('logout',async t=>{
      const result = await service.actions('logout',tokenid)
      t.ok(result)
      t.end()
    })
    t.test('user',async t=>{
      try{
        await service.actions('user',tokenid)
      }catch(e){
        t.ok(e)
      }
      t.end()
    })
    t.test('end',t=>{
      t.end()
      process.exit(1)
    })
  })
})
