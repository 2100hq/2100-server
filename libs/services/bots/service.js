const SocketClient = require('../../socket/client')
const ethers = require('ethers')
//bots require disabled auth
module.exports = async config =>{
  const provider = new ethers.providers.JsonRpcProvider(config.ethers.provider.url)
  provider.on('error',console.log)

  const actions = {
    socket : await SocketClient(config['2100'].host),
    admin : socket('admin'),
    system : socket('system'),
    auth : socket('auth'),
  }

  await actions.auth.call('authenticate',undefined,config.systemAddress)
  await actions.system.call('setAdmin',{userid:config.systemAddress,isAdmin:true})

  function Handler(config,{actions,provider}){
    const {privateKey} = config
    return {
      async Start(state){
        state.wallet = new ethers.Wallet(privateKey,provider)
        state.socket = await SocketClient(config['2100'].host)
        state.actions = {
          public: socket('public'),
          private: socket('private'),
          auth:socket('auth'),
        }
        await state.actions.auth.call('authenticate',undefined,state.wallet.address)
      },
      Login(state){
      },
      SetBalance(state){
      },
      ChooseAction(state){
      },
      CreateToken(state){
      },
    }
  }
}
