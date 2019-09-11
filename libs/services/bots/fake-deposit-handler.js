const lodash = require('lodash')
const Promise = require('bluebird')
const assert = require('assert')
const moment = require('moment')
const ethers = require('ethers')

module.exports = (config,libs)=>{
    const {privateKey} = config
    return {
      async Start(state){
        // return 'Unstake'
        return 'Wait Deposit'
        // return 'Start'
      },
      async ChooseAction(state){
        // const primaryBalance = await fakedai.balanceOf(state.wallet.address)
        // state.log('balance',state.server.public)
        let balance = lodash.get(state.server.private,['myWallets','available',state.server.public.config.primaryToken,'balance'],'0')
        // state.log(state.server.public)
        const available = ethers.utils.bigNumberify(balance)
        state.log({available:available.toString()})
        if(available.gt(0)){
          return 'Check My Token'
        }
        return 'End'
      },
      async 'Check My Token'(state){
        const myTokens = state.server.private.myTokens
        console.log('myTokens',myTokens)
        if(lodash.size(myTokens)){
          return 'Check Stakes'
        }
        return 'Create My Token'
      },
      async 'Create My Token'(state){
        return state.adminActions.admin.call('createTokenByName',{name:state.tokenName,ownerAddress:state.wallet.address.toLowerCase(),creatorAddress:state.wallet.address.toLowerCase()}).then(x=>{
          state.log(x)
          return 'Check My Token'
        }).catch(err=>{
          console.log(err.message)
          return 'Check My Token'
        })
      },
      async Deposit(state){
        const primaryBalance = await fakedai.balanceOf(state.wallet.address)
        console.log(primaryBalance.toString())
        const tx = await state.controller.deposit(primaryBalance.toString(),{
          gasLimit:2e6,
          gasPrice:1
        })
        state.log(tx)
        return tx.wait().then(x=>'Wait Deposit')
          // .catch(err=>{
          // state.log(err)
          // return 'Wait Deposit'
        // })
      },
      async 'Wait Deposit'(state){
        state.log(state.server)
        const available = lodash.get(state.server.private,['myWallets','available',state.server.public.config.primaryToken,'balance'],'0')
        // const available = state.server.private.myWallets.available[state.server.public.primaryToken] || '0'
        state.log('deposit available',available)
        if(ethers.utils.bigNumberify(available).gt(0)){
          return 'ChooseAction'
        }
        state.waitDeposit = state.waitDeposit || moment().add(10,'minute').valueOf()
        if(Date.now() < state.waitDeposit){
          state.waitDeposit = null
          return 'ChooseAction'
        }
        // state.log(state.server.private.me.id,'awaiting deposit')
        return 'Wait Deposit'
      },
      async Unstake(state){
        const stakes = lodash.reduce(lodash.get(state.server.private,'myStakes',{}),(result,value,key)=>{
          if(key.toLowerCase() === state.server.public.config.primaryToken.toLowerCase()){
            return result
          }
          result[key] = value
          return result
        },{})
        const unstake = lodash.mapValues(stakes,x=>'0')
        if(lodash.size(unstake)){
          const cmd = await state.actions.private.call('stake',unstake).catch(err=>{
            console.log(err.message,unstake)
            throw err
          })
        }
        return 'End'
      },
      async 'Fixed Stakes'(state){
        const tokens = Object.values(lodash.get(state.server.public,'tokens.active',{}))
        const available = lodash.get(state.server.private,['myWallets','available',state.server.public.config.primaryToken,'balance'],'0')
        const stakes = lodash.get(state.server.private,'myStakes',{})
        let total = ethers.utils.bigNumberify(available)
        total = total.add(...Object.values(stakes))

        const newStakes = {}
        tokens.reduce((result,token)=>{
          const {minimumStake} = token
          result[token.id] = '0'
          const size = ethers.utils.bigNumberify(minimumStake)
          if(size.gt(total)) return result
          if(lodash.size(result) > state.numstakes) return result

          result[token.id] = size.toString()
          total = total.sub(size)
          return result

        },newStakes)
        const cmd = await state.actions.private.call('stake',newStakes)
        state.log(cmd)
        return 'End'
      },
      async 'Randomize Stakes'(state){
        const tokens = Object.values(lodash.get(state.server.public,'tokens.active',{}))
        const available = lodash.get(state.server.private,['myWallets','available',state.server.public.config.primaryToken,'balance'],'0')
        const stakes = lodash.get(state.server.private,'myStakes',{})
        let total = ethers.utils.bigNumberify(available)
        console.log({stakes})
        total = total.add(0,...Object.values(stakes))

        const newStakes = {}
        tokens.reduce((result,token)=>{
          const {minimumStake} = token
          if(total.lt(minimumStake)) return result
          const size = ethers.utils.bigNumberify(minimumStake).mul(parseInt(Math.random() * 10))
          result[token.id] = size.toString()
          total = total.sub(size)
          return result
        },newStakes)
        const cmd = await state.actions.private.call('stake',newStakes)
        state.log(cmd)
        return 'Check Stakes'
      },
      async 'Wait Unstake'(state){
        if(state.unstakeTime == null){
          return 'ChooseAction'
        }
        if(state.unstakeTime <= Date.now()){
          return 'Unstake'
        }
        return 'Wait Unstake'
      },
      async 'Wait Randomize Stakes'(state){
        if(state.unstakeTime == null){
          return 'Check Stakes'
        }
        if(state.unstakeTime <= Date.now()){
          return 'Randomize Stakes'
        }
        state.log('update stake in',moment.duration(state.unstakeTime - Date.now()).seconds(),'seconds')
        return 'Wait Randomize Stakes'
      },
      async 'Check Stakes'(state){
        const available = lodash.get(state.server.private,['myWallets','available',state.server.public.config.primaryToken,'balance'],'0')
        const stakes = lodash.get(state.server.private,'myStakes',{})
        if(!state.iterations) state.iterations = 0
        state.iterations ++
        if(ethers.utils.bigNumberify(available).gt(0) && lodash.size(stakes) === 0){
          return 'Randomize Stakes'
          // return 'Fixed Stakes'
        }
        if(lodash.size(stakes)){
          state.unstakeTime = moment().add(parseInt((Math.random() * 60)),'seconds').valueOf()
          return 'Wait Randomize Stakes'
          // return 'Fixed Stakes'
        }
        // return 'ChooseAction'
        return 'Wait Randomize Stakes'
      },
      End(){
        return 'End'
      }
    }
  }
