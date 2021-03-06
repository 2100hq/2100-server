const test = require('tape')
const Models = require('../../../../services/2100/models-cache')
const {GetWallets} = require('../../../../utils')
const Model = require('.')

const config = {
  primaryToken:'dai',
  tokens:{
    supply:'2100000000000000000000' ,
    creatorReward:'0'               ,
    ownerShare:.1                 ,
    ownerAddress:'0'                ,
    reward:'210000000000000'        ,
    decimals:18        ,
  }
}
test('createToken',t=>{
  let libs
  t.test('init',async t=>{
    libs = await Models(config).catch(t.end)
    libs.getWallets = GetWallets(libs.wallets)
    t.ok(libs)
    t.end()
  })
  t.test('handler',t=>{
    let handler,command
    t.test('init',t=>{
      handler = Model.Handler(config,libs)
      t.ok(handler)
      t.end()
    })
    // t.test('set wallets',async t=>{
    //   await libs.getWallets('internal').getOrCreate('test','DAI')
    //   await libs.getWallets('locked').getOrCreate('test','DAI')
    //   await libs.getWallets('internal').deposit('test','DAI',1)
    //   await libs.getWallets('locked').deposit('test','DAI',1)
    //   t.end()
    // })
    t.test('createToken',async t=>{
      command = await libs.commands.createType('createPendingToken',{
        name:'test',
        userid:'userid',
      })
      t.ok(command)
      console.log(command)
      t.end()
    })
    t.test('step',async t=>{
      command = await handler[command.state](command)
      command = await handler[command.state](command)
      t.ok(command.done)
      const token = await libs.tokens.pending.get(command.name)
      t.ok(token)
      t.end()
    })
  })
})

