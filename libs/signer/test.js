require('dotenv').config()
const ethers = require('ethers')
const test = require('tape')
const parseEnv = require('../parseEnv')
const config = parseEnv(process.env)
const Signer = require('.')

const provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
const contracts = [
  require('2100-contracts/build/contracts/Controller'),
  require('2100-contracts/build/contracts/DummyDAI'),
]
const [controller,fakedai] = contracts.map(contract=>{
  return new ethers.Contract(contract.networks['2100'].address,contract.abi,provider)
})

test('signer',t=>{
  let signer,hash,signature
  t.test('init',async t=>{
    signer = await Signer(config.test,{provider})
    t.ok(signer)
    t.end()
  })
  t.test('createTokenMessage',async t=>{
    hash = await signer.createTokenMessage('test')
    console.log(hash)
    t.ok(hash)
    t.end()
  })
  t.test('sign',async t=>{
    signature = await signer.sign(hash)
    console.log(signature)
    t.ok(signature)
    t.end()
  })
  t.test('validate sig', async t=>{
    const split = ethers.utils.splitSignature(signature)
    //on chain verify
    let valid = await controller.isValidSignature(config.test.publicKey,hash,split.v,split.r,split.s)
    t.ok(valid)
    //off chain verify
    const addr = await signer.verifyHash(hash,signature)
    t.ok(addr.toLowerCase() === config.test.publicKey.toLowerCase())
    t.end()
  })
})
