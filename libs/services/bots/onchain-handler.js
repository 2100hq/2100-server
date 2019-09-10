  moduel.exports = config=>{
    const {privateKey} = config
    return {
      async Start(state){
        await state.actions.auth.call('authenticate',undefined,state.wallet.address.toLowerCase())
        // return 'Unstake'
        return 'Check Eth'
      },
      async 'Check Eth'(state){
        const balance = await state.wallet.getBalance()
        state.log('mybalance',balance.toString())
        if(balance.gt(0)){
          return 'ChooseAction'
        }
        const systbalance = await wallet.getBalance()
        const seed = ethers.utils.parseEther('0.0001')
        state.log('system balance',systbalance.toString())
        if(balance.gte(seed)){
          throw new Error('you need a system account with some eth')
        }

        const tx = await wallet.sendTransaction({
          to:state.wallet.address,
          value:seed,
          nonce,
        })
        await tx.wait()
        nonce = nonce || tx.nonce
        nonce ++
        return 'Approve'
         
      },
      async Approve(state){
        const approve = await state.fakedai.approve(controller.address,ethers.utils.bigNumberify(2).pow(256).sub(1),{ gasLimit:2e6, gasPrice:1 }) 
        state.log(approve)
        await approve.wait().then(x=>{
          state.log('approved')
        }).catch(err=>{
          state.log(err.message)
        })
        return 'ChooseAction'
      },
      async Log(state){
        state.log(state.server.private)
      },
      async Faucet(state){
        const primary = await state.fakedai.balanceOf(state.wallet.address)
        const systembal = await state.fakedai.balanceOf(config.systemAddress)
        const available = state.server.private.myWallets.available[state.server.public.primaryToken] || 0
        const faucet = ethers.utils.parseEther(config.bots.faucet)
        state.log({primary:primary.toString(),available,systembal:systembal.toString(),faucet:faucet.toString()})
        const tx = await fakedai.transfer(state.wallet.address,faucet,{nonce})
        state.log(tx)
        await tx.wait()
        nonce = nonce || tx.nonce
        nonce ++
        return 'ChooseAction'
      },
      async ChooseAction(state){
        const primaryBalance = await fakedai.balanceOf(state.wallet.address)
        // state.log('balance',state.server.public)
        let balance = lodash.get(state.server.private,['myWallets','available',state.server.public.config.primaryToken,'balance'],'0')
        // state.log(state.server.public)
        const available = ethers.utils.bigNumberify(balance)
        state.log({primaryBalance:primaryBalance.toString(),available:available.toString()})
        const approved = await fakedai.allowance(state.wallet.address,controller.address)
        // state.log({approved:approved.toString()})
        if(approved.eq(0)){
          return 'Approve'
        }

        if(primaryBalance.eq(0) && available.eq('0')){
          return 'Faucet'
        }
        if(primaryBalance.gt(0) && available.eq('0')){
          state.log('primary balance',primaryBalance.toString())
          return 'Deposit'
        }
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
        if(state.couponSubmitted){
          return 'Check My Token'
        }
        const pending = state.server.public.tokens.pending[state.tokenName]

        if(pending){
          return 'Confirm My Token'
        }

        return 'Create My Token'
      },
      async 'Confirm My Token'(state){
        const coupon = lodash.find(state.server.public.coupons.create,{name:state.tokenName})
        if(!coupon) return 'Check My Token'
        state.log('coupon',coupon)
        const result = await state.controller.create(
          coupon.data.symbol,
          coupon.data.messageId,
          coupon.data.v,
          coupon.data.r,
          coupon.data.s,
          { gasLimit:2e6, gasPrice:1 }
        )
        state.log('tx',result)
        await result.wait().catch(err=>state.log(err.message))
        state.couponSubmitted = true
        return 'Check My Token'
      },
      async 'Create My Token'(state){
        return actions.admin.call('createTokenByName',{name:state.tokenName,ownerAddress:state.wallet.address.toLowerCase(),creatorAddress:state.wallet.address.toLowerCase()}).then(x=>{
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
        total = total.add(...Object.values(stakes))

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
          // return 'Randomize Stakes'
          return 'Fixed Stakes'
        }
        if(lodash.size(stakes)){
          state.unstakeTime = moment().add(parseInt((Math.random() * 60)),'seconds').valueOf()
          // return 'Randomize Stakes'
          return 'Fixed Stakes'
        }
        return 'ChooseAction'
      },
      End(){
        return 'End'
      }
    }
  }

