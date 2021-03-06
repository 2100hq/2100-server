const test = require('tape')
const lodash = require('lodash')
const Promise = require('bluebird')
const Models = require('../../../../services/2100/models-cache')
const {GetWallets} = require('../../../../utils')
const Model = require('.')

const config = {
  primaryToken:'0xa',
  tokens:{
    supply:'2100000000000000000000' ,
    creatorReward:'0'               ,
    ownerShare:.1                 ,
    ownerAddress:'0'                ,
    reward:'210000000000000'        ,
    decimals:18        ,
  }
}
test('setAbsoluteStakes',t=>{
  let libs
  t.test('init',async t=>{
    libs = await Models(config).catch(t.end)
    libs.getWallets = GetWallets(libs.wallets)
    t.ok(libs)
    t.end()
  })
  t.test('handler',t=>{
    let handler,command,userid
    t.test('init',t=>{
      userid='test'
      handler = Model.Handler(config,libs)
      t.ok(handler)
      t.end()
    })
    t.test('init tokens/wallets',async t=>{
      await libs.getWallets('stakes').getOrCreate(userid,config.primaryToken)
      await libs.getWallets('stakes').setBalance(userid,config.primaryToken,10)
      await libs.tokens.active.create({
        id:config.primaryToken,
        name:config.primaryToken,
        creatorAddress:'0x0',
        createdBlock:0,
        ownerAddress:'0x0',
        contractAddress:'0x0',
      })
      await Promise.map(lodash.times(7,i=>'0x' + i),id=>{
        return libs.getWallets('stakes').getOrCreate(userid,id).then(x=>{
          return libs.getWallets('stakes').setBalance(userid,id,1)
        }).then(result=>{
          return libs.tokens.active.create({
            id,
            name:id,
            creatorAddress:'0x0',
            createdBlock:0,
            ownerAddress:'0x0',
            contractAddress:'0x0',
          })
        })
      })


      t.end()
    })
    t.test('rebalanceStakes deposit',async t=>{
      await libs.getWallets('available').getOrCreate(userid,config.primaryToken)
      await libs.getWallets('available').setBalance(userid,config.primaryToken,20)
      command = await libs.commands.createType('rebalanceStakes',{
        userid,
      })
      t.ok(command)
      console.log(command)
      t.end()
    })
    t.test('step',async t=>{
      try{
        command = await handler[command.state](command)
        console.log(command)
        command = await handler[command.state](command)
        console.log(command)
        command = await handler[command.state](command)
        console.log(command)
        const stakes = await libs.getWallets('stakes').getByUser(userid)
        console.log(stakes)
        t.ok(stakes.length)
        t.ok(command.done)
        t.ok(command.resolve)
        t.end()
      }catch(err){
        t.end(err)
      }
    })
    t.test('rebalanceStakes overdraw',async t=>{
      await libs.getWallets('available').getOrCreate(userid,config.primaryToken)
      await libs.getWallets('available').setBalance(userid,config.primaryToken,5)
      command = await libs.commands.createType('rebalanceStakes',{
        userid,
      })
      t.ok(command)
      console.log(command)
      t.end()
    })
    t.test('step',async t=>{
      try{
        command = await handler[command.state](command)
        console.log(command)
        command = await handler[command.state](command)
        console.log(command)
        command = await handler[command.state](command)
        console.log(command)
        const stakes = await libs.getWallets('stakes').getByUser(userid)
        console.log(stakes)
        t.ok(stakes.length)
        t.ok(command.done)
        t.ok(command.resolve)
        t.end()
      }catch(err){
        t.end(err)
      }
    })
  })
})


