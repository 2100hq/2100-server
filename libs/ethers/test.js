const test = require('tape')
const Ethers = require('./')
const Catchup = require('./catchup')
const assert = require('assert')


test('ethers',t=>{
  let ethers, latestBlockNumber
  t.test('init',async t=>{
    ethers = await Ethers({
      provider:{
        type:'JsonRpcProvider',
        url:'http://artax.dev.2100.co',
      }
    })
    latestBlockNumber = await ethers.getBlockNumber()
    t.ok(ethers)
    t.end()
  })
  // t.test('catchup',t=>{
  //   let catchup
  //   t.test('init',async t=>{
  //     let last = 0
  //     const lastnumber = await Catchup({startBlock:latestBlockNumber-10},ethers,block=>{
  //       console.log('catchup',last,block)
  //       if(last){
  //         t.ok(block - 1 === last)
  //       }
  //       last = block
  //     })
  //     t.end()
  //     console.log(latestBlockNumber,lastnumber)
  //   })
  // })
  t.test('ethers',async t=>{
    let last = 0
    ethers = await Ethers({
      defaultStartBlock:latestBlockNumber-1000,
      provider:{
        type:'JsonRpcProvider',
        url:'http://artax.dev.2100.co',
      }
    },null,(type,block)=>{
      console.log('ethers block',block)
      // console.log(last,block.number)
      // if(last){
      //   t.ok(block.number - 1 === last)
      // }
      // last = block.number
    })
    t.end()
  })
})
