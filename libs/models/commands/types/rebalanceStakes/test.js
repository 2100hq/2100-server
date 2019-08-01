const test = require('tape')
const lodash = require('lodash')
const Promise = require('bluebird')
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
test('rebalanceStakes',t=>{
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
    t.test('init tokens',async t=>{
      await Promise.map(lodash.times(7,i=>'0x' + i),id=>{
        return libs.tokens.active.create({
          id,
          name:id,
          creatorAddress:'0x0',
          createdBlock:0,
          ownerAddress:'0x0',
          contractAddress:'0x0',
        })
      })
      t.end()
    })
    t.test('rebalanceStakes',async t=>{
      command = await libs.commands.createType('rebalanceStakes',{
        userid:'test',
        stakes:{
          '0x0':.1,
          '0x1':.1,
          '0x2':.1,
          '0x3':.1,
        }
      })
      t.ok(command)
      console.log(command)
      t.end()
    })
    t.test('step',async t=>{
      command = await handler[command.state](command)
      // console.log(command)
      command = await handler[command.state](command)
      // console.log(command)
      const stakes = await libs.getWallets('stakes').getByUser('test')
      // console.log(stakes)
      t.ok(stakes.length)
      t.ok(command.done)
      t.ok(command.resolve)
      t.end()
    })
    t.test('rebalanceStakes failure',async t=>{
      command = await libs.commands.createType('rebalanceStakes',{
        userid:'test',
        stakes:{
          '0x3':.2,
          '0x4':.2,
          '0x5':.2,
          '0x6':.2,
        }
      })
      t.ok(command)
      // console.log(command)
      t.end()
    })
    t.test('step',async t=>{
      command = await handler[command.state](command)
      command = await handler[command.state](command)
      const stakes = await libs.getWallets('stakes').getByUser('test')
      t.ok(command.done)
      t.ok(command.reject)
      t.end()
    })
  })
})
