const Client = require('.')
const Socket = require('./socket')
const test = require('tape')

const host = 'ws://localhost:9314'
test('2100 client',t=>{
  // t.test('2100 socket',t=>{
    // let socket
    // t.test('init',async t=>{
    //   socket = await Socket(host)
    //   t.ok(socket)
    //   t.end()
    // })
    // t.test('call',async t=>{
    //   const result = await socket('public').call('echo','test')
    //   console.log(result)
    //   t.equal(result,'test')
    //   t.end()
    // })
    // t.test('disconnect',t=>{
    //   socket('public').socket.disconnect()
    //   t.end()
    // })
  // })
  t.test('2100 client',t=>{
    let client
    let state = {}
    t.test('init',async t=>{
      client = await Client({host,channels:['public']},state)
      t.ok(client)
      t.end()
    })
    t.test('public state',async t=>{
      const publicState = await client.public.call('state')
      console.log('test',state)
      t.end()
    })
  })
})

