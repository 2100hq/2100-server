//have start block
//have initial end block
//block number keeps counting
//need to buffer new blocks
//run through historical blocks
//then emit them all
//and then hook in to real time updates
const highland = require('highland')
const assert = require('assert')
const lodash = require('lodash')
//this ended up being overly complicated because i didnt realize
//all we care about is the block number, could be done much simpler, oh well
module.exports = async ({startBlock,delay},ethers,emit)=>{
  assert(lodash.isFinite(startBlock),'requires a start block number')
  let lastBlock = 0

  //stream buffer for blocks
  function Buffer(stream=highland()){
    return block=>{
      stream.write(block)
    }
  }

  const newBlocks = highland()
  const cb = Buffer(newBlocks)

  //buffer incoming blocks
  ethers.on('block',cb)
  //get latest block number
  const currentBlockNumber = await ethers.getBlockNumber()

  //create the old block stream
  const oldBlocks = highland()

  //emit all old blocks first
  await oldBlocks.doto(emitBlock).last().toPromise(Promise)

  // console.log({currentBlockNumber,startBlock})
  //emit blocks up to latest block
  await emitBlocks(startBlock,currentBlockNumber,Buffer(oldBlocks))

  //now emit all new blocks
  await newBlocks.each(emitBlock)
  
  //remove new listener
  ethers.removeListener('block',cb)

  function emitBlock(number){
    if(number > lastBlock) lastBlock = number
    emit(number)
  }

  //helper function
  async function emitBlocks(startNumber,endNumber,emit){
    assert(startNumber >= 0,'requires number equal to or greater to 0')
    assert(endNumber >= 0,'requires end number greater or equal to 0')
    assert(startNumber <= endNumber,'start must be less than or equal to end')
    if(startNumber === endNumber){
      return emit(startNumber)
    }
    await emit(startNumber)
    return emitBlocks(startNumber + 1,endNumber,emit)
  }
  //return to business as usual
  return lastBlock

}
