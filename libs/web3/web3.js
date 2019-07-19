const Web3 = require('web3')
const Timeout = require('p-timeout')
// const Deferred = require('p-defer')
const Lookup = require('triton-helpers-symbol-lookup')
const assert = require('assert')
// const Wallet = require('triton-helpers-eth-hd-wallet')
// const highland = require('highland')
const { loopUntil } = require('./utils')

async function Web3Client (config, emit = x => x) {
  const {
    networkId,
    publicAddress,
    privateAddress,
    providerUrl,
    timeout = 10000,
    defaultGas = '21000'
  } = config
  assert(networkId, 'requires a network id')
  // assert(publicAddr,'requires public addr')
  // assert(privateAddr,'requires private addr')
  assert(providerUrl, 'requires provider url')

  // const wallet = await Wallet(config.wallet)
  // const publicAddress = config.wallet.publicAddress
  const web3 = new Web3(providerUrl)
  const provider = web3.currentProvider

  // const gasEstimationMultiple = 10 // increase the gas limit by this multiple so we don't run out of gas on transactions; this also means we need the multiple times the gasPrice in our ETH balance

  const lookup = Lookup({ defaultNetwork: networkId })

  // const syncDeferred = Deferred()
  // const connectionDeferred = Deferred()
  let newBlockHeadersSub

  // let isSynced
  // let isConnected = false
  // let isReady = false
  // let lastestBlockNumber = 0
  // let newBlockHeadersStream

  const connectResult = new Promise((resolve, reject) => {
    provider.once('end', e => {
      reject(e || new Error('Provider called `end`'))
    })
    provider.once('error', e => {
      reject(new Error(e || 'Provider called `error`'))
    })
    provider.once('connect', () => {
      resolve()
    })
  })

  await Timeout(
    connectResult,
    timeout,
    `Timeout trying to connect to ${providerUrl} provider after ${timeout} ms`
  )

  provider.on('end', e => {
    emit('end', e)
  })
  provider.on('error', e => {
    emit('error', e)
  })
  provider.on('close', e => {
    emit('close', e)
  })

  async function getTxCount (addr = publicAddress) {
    return web3.eth.getTransactionCount(addr)
  }

  // async function getTxCount () {
  //   await isReadying()

  //   // if a transaction awaiting approval, wait until it's done
  //   if (state.hasSubmittedTx()) {
  //     await state.waitForSubmittedTxToResolve()
  //   }

  //   // if there are no unconfirmed transactions then defer to the blockchain; this gives us the opportunity to make sure we're in sync with the network
  //   if (
  //     state.unconfirmedTxCount().length === 0 ||
  //     state.get('transactionCount') == null
  //   ) {
  //     const transactionCount = await web3.eth.getTxCount(publicAddress)
  //     state.set('transactionCount', transactionCount)
  //   }

  //   // otherwise use our state
  //   return state.get('transactionCount')
  // }

  function isSyncing () {
    return web3.eth.isSyncing()
  }

  function awaitSync (rate = 1000) {
    return loopUntil(async x => {
      return !await isSyncing()
    }, rate)
  }

  async function estimateGas (tx, opts) {
    assert(tx, 'requires transaction')
    return web3.eth.estimateGas({
      to: tx.to,
      from: tx.from,
      gasPrice: tx.gasPrice,
      gas: tx.gas,
      value: tx.value,
      data: tx.data,
      nonce: tx.nonce
    })
  }

  async function signTxParams (tx, addr = privateAddress) {
    const result = await web3.eth.accounts.signTransaction(tx, addr)
    // console.log('signed tx',result)
    return result.rawTransaction
  }

  async function tokenBalance (symbol, from = publicAddress) {
    const { address } = lookup.getContract(symbol)
    const abi = lookup.getAbi('ERC20')
    const result = await readContract({
      method: 'balanceOf',
      abi,
      address,
      args: [from]
    })
    return web3.utils.fromWei(result.toString(), 'ether')
  }

  // read only
  async function readContract (params) {
    const {
      abi,
      to,
      method,
      args = [],
      from = publicAddress,
      ...options
    } = params
    assert(abi, 'requires abi')
    assert(to, 'requires contract to')
    assert(method, 'requires contract method name')
    const contract = new web3.eth.Contract(abi, to)
    const call = contract.methods[method](...args)
    return call.call({ from, ...options })
  }

  async function contractTx (params) {
    let { abi, method, args = [], to, from = publicAddress } = params
    assert(abi, 'requires abi')
    assert(to, 'requires contract to address')
    assert(method, 'requires contract method name')
    // assert(gas,'requires gas amount')
    const contract = new web3.eth.Contract(abi, to)
    const call = contract.methods[method](...args)

    const result = {
      ...params,
      from,
      data: await call.encodeABI()
    }
    // console.log('contract tx',result)
    return result
  }

  function ethTx ({
    to,
    value,
    gas = defaultGas,
    from = publicAddress,
    ...rest
  }) {
    assert(to, 'requires address to')
    assert(gas, 'requires gas')
    assert(from, 'requires address from')
    assert(value, 'requires value in eth')
    value = web3.utils.toWei(value.toString(), 'ether')
    return {
      ...rest,
      to,
      from,
      gas,
      value,
      data: '0x'
    }
  }

  async function sendEth (params) {
    return sendTx(ethTx(params))
  }

  async function erc20Tx ({ symbol, to, value, ...rest }) {
    assert(symbol, 'requires token symbol')
    assert(to, 'requires address to')
    assert(value, 'requires token value to send in Eth')

    value = web3.utils.toWei(value.toString(), 'ether')

    const { address } = lookup.getContract(symbol)
    const abi = lookup.getAbi('ERC20')
    return contractTx({
      ...rest,
      abi,
      to: address,
      method: 'transfer',
      args: [to, value]
    })
  }

  // send as eth value, will convert to gwei
  async function sendErc20 (params) {
    return sendTx(await erc20Tx(params))
  }

  async function sendTx (tx) {
    // console.log('sending tx',tx)
    // const {from=publicAddress} = tx
    assert(tx.to, 'requires address of contract to')
    assert(tx.data, 'requires data')
    assert(tx.gas, 'requires gas amount')
    const strip = {
      to: tx.to,
      from: tx.from,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      nonce: tx.nonce,
      data: tx.data,
      value: tx.value
    }
    const signed = await signTxParams(strip)
    const hash = await sendSignedTx(signed)
    return {
      ...tx,
      hash,
      signed
    }
  }

  async function getEthBalance (addr = publicAddress) {
    const result = await web3.eth.getBalance(addr)
    return web3.utils.fromWei(result, 'ether')
  }
  function getTx (hash) {
    return web3.eth.getTransaction(hash)
  }

  async function getHashReceipt (hash) {
    return web3.eth.getTransactionReceipt(hash)
  }

  function getTxReceipt ({ hash }) {
    return getHashReceipt(hash)
  }

  function getTrackerReceipts (ethRequests) {
    if (ethRequests.ethRequests) ethRequests = ethRequests.ethRequests // passed in tracker /shrug
    return Promise.all(ethRequests.map(getTxReceipt))
  }

  function sendSignedTx (signedTx) {
    const emitter = web3.eth.sendSignedTransaction(signedTx) // DO NOT "await" THIS.... the emitterPromise thing only resolves when a receipt is received.
    return new Promise((resolve, reject) => {
      emitter.once('transactionHash', resolve)
      emitter.once('error', reject)
    })
  }

  async function subscribeNewBlockHeaders () {
    if (newBlockHeadersSub) return newBlockHeadersSub
    newBlockHeadersSub = await web3.eth.subscribe('newBlockHeaders')
    newBlockHeadersSub.on('data', data => emit('newBlockHeaders', data))
    newBlockHeadersSub.on('error', data => emit('error', data))
    return newBlockHeadersSub
  }

  function close () {
    return provider.connection.close()
  }

  // function subscribeNewBlockHeaders () {
  //   if (!newBlockHeadersStream) {
  //     newBlockHeadersStream = highland(
  //       'data',
  //       web3.eth.subscribe('newBlockHeaders')
  //     )
  //     newBlockHeadersStream.doto(data => (lastestBlockNumber = data.number))
  //     isReadying.then(() => newBlockHeadersStream.resume()) // if the node isn't ready don't resume the stream (keep it paused)
  //   }

  //   return newBlockHeadersStream.observe() // return a new version of the stream that can have its own backpressure
  // }

  return {
    // isReadying,
    // isReady,
    // buildTxFromRequest,
    signTxParams,
    getTxCount,
    sendSignedTx,
    getHashReceipt,
    getTxReceipt,
    getTx,
    isSyncing,
    awaitSync,
    estimateGas,
    getTrackerReceipts,
    subscribeNewBlockHeaders,
    close,
    getEthBalance,
    ethTx,
    sendEth,
    erc20Tx,
    sendErc20,
    contractTx,
    sendTx,
    readContract,
    tokenBalance,
    utils () {
      return web3.utils
    },
    publicAddress () {
      return publicAddress
    }
  }
}

module.exports = Web3Client
