const test = require('tape')
const Models = require('../../../../services/2100/models-cache')
const {GetWallets} = require('../../../../utils')
const Model = require('.')

test('withdrawPrimary',t=>{
  let libs
  t.test('init',async t=>{
    libs = await Models().catch(t.end)
    libs.getWallets = GetWallets(libs.wallets)
    t.ok(libs)
    t.end()
  })
  t.test('handler',t=>{
    let handler,command
    t.test('init',t=>{
      handler = Model.Handler({primaryToken:'DAI'},libs)
      t.ok(handler)
      t.end()
    })
    t.test('set wallets',async t=>{
      await libs.getWallets('internal').getOrCreate('test','DAI')
      await libs.getWallets('locked').getOrCreate('test','DAI')
      await libs.getWallets('internal').deposit('test','DAI',1)
      await libs.getWallets('locked').deposit('test','DAI',1)
      t.end()
    })
    t.test('create withdraw',async t=>{
      command = await libs.commands.createType('withdrawPrimary',{
        fromAddress:'test',
        blockNumber:0,
        value:'1.5',
      })
      t.ok(command)
      t.end()
    })
    t.test('step',async t=>{
      command = await handler[command.state](command)
      console.log(command)
      command = await handler[command.state](command)
      console.log(command)
      const internal = await libs.getWallets('internal').get('test','DAI')
      const locked = await libs.getWallets('locked').get('test','DAI')
      t.equal(locked.balance,0)
      t.equal(internal.balance,.5)
      t.end()
    })
  })
})
