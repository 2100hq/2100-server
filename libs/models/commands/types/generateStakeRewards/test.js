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
test('generateStakeRewards',t=>{
  let libs
  t.test('init',async t=>{
    libs = await Models(config).catch(t.end)
    libs.getWallets = GetWallets(libs.wallets)
    t.ok(libs)
    t.end()
  })
  t.test('handler',t=>{
    let handler,command
    const tokenid = '0x0'
    const ownerid = '0x1'
    const stakers = 10
    t.test('init',t=>{
      handler = Model.Handler(config,libs)
      t.ok(handler)
      t.end()
    })
    t.test('init tokens',async t=>{
      await libs.tokens.active.create({
        id:tokenid,
        name:tokenid,
        creatorAddress:tokenid,
        createdBlock:0,
        ownerAddress:ownerid,
        contractAddress:tokenid,
      })
      await libs.getWallets('available').create({
        tokenid:tokenid,
        userid:tokenid,
        balance:config.tokens.supply,
      })
      await Promise.all(lodash.times(stakers,i=>{
        return libs.getWallets('stakes').create({
          tokenid,
          userid:'0xA' + i,
          balance:(i * 10).toString()
        })
      }))
      t.end()
    })
    t.test('generateStakeRewards',async t=>{
      command = await libs.commands.createType('generateStakeRewards',{
        userid:'system',
        tokenid,
        ownerAddress:ownerid,
        ownerShare:config.tokens.ownerShare,
        reward:config.tokens.reward,
        minimum:'0',
      })
      t.ok(command)
      t.end()
    })
    t.test('step',async t=>{
      command = await handler[command.state](command)
      console.log(command)
      command = await handler[command.state](command)
      console.log(command)
      t.ok(command)
      t.ok(command.receipts.length)
      t.end()
    })
  })
})
