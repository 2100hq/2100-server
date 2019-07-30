const ethers = require('ethers')
const assert = require('assert')
module.exports = (config ,{provider})=>{
  assert(config.privateKey,'requires private key')
  assert(provider,'requires provider')

  const wallet = new ethers.Wallet(config.privateKey,provider)

  function createTokenMessage(str){
    return ethers.utils.solidityKeccak256(
      ['string', 'string'],
      ['CREATE', str]
    )
  }
  
  function mintTokenMessage(token,account,amount,salt){
    return ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256', 'uint256'],
      ['MINT', token, account, amount, salt]
    )
  }

  async function sign(hash){
    //we have to arrayify for some reason to get this
    //to pass signature check on chain 
    return wallet.signMessage(await ethers.utils.arrayify(hash))
  }

  async function verifyHash(message,signed){
    //we have to arrayify message to pass signature check on chain 
    message = await ethers.utils.arrayify(message)
    return ethers.utils.verifyMessage(message,signed)
  }

  async function verifyMessage(message,signed){
    return ethers.utils.verifyMessage(message,signed)
  }

  function address(){
    return wallet.address
  }

  return {
    sign,
    createTokenMessage,
    mintTokenMessage,
    verifyMessage,
    verifyHash,
    address,
  }
}
