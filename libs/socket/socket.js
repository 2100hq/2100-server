const lodash = require('lodash')
const assert = require('assert')
var Http = require('http')
var Socket = require('socket.io')

module.exports = async (config, libs) => {
  const {actions,events,query,users} = libs
  assert(actions, 'requires actions library')
  assert(actions.private, 'requires private library')
  assert(actions.public, 'requires public library')
  assert(actions.admin, 'requires admin library')
  assert(actions.auth, 'requires auth library')
  // assert(events, 'requires events library')
  assert(query, 'requires query library')
  assert(users, 'requires users library')
  // assert(services.private, 'requires private service')
  // assert(services.admin, 'requires admin service')
  assert(config.port, 'requires socket port')

  console.log('port',config)
  var server = Http.createServer()
  var io = Socket(server, {})

  io.listen(config.port)
  const batching = new Map()

  io.on('connection', socket => {

    socket.token = libs.ethers.utils.hashMessage(socket.id)

    // console.log('connected',socket.id,socket.token)
    socket.on('disconnect', function() {
      console.log('disconnect',socket.user)
    })

    //send user public state snapshot
    // io.emit('public',[],await query.publicState())

    socket.on('auth',(action,args,cb=x=>x)=>{
      console.log('auth message',socket.id,action,args)
      switch(action){
          case 'token':
            return cb(null,socket.token)
          case 'authenticate':
            const [signed,address] = args
            let valid = false
            try{
              valid = libs.authenticate(socket.token,signed,address)
              assert(valid,'Authentication Failed')
              socket.userid = address
              return cb(null, address)
            }catch(err){
              return cb(err.message)
            }
      }
      //console.log('authing',action)
      //actions.auth(socket.user,action,...args)
      //  .then(async result => {
      //    if(action == 'login'){
      //      console.log('login',result)
      //      //join private channel
      //      socket.join(result.id)
      //      io.to(result.id).emit('private',[],await query.privateState(result.id))
      //      //join admin channel
      //      socket.join('admin')
      //      io.to('admin').emit('admin',[],await query.adminState(result.id))

      //      //attach user to state
      //      socket.user = result
      //      socket.admin = true
      //    }
      //    if(action == 'logout'){
      //      socket.user = null
      //      socket.admin = false
      //    }
      //    if (cb) cb(null, result)
      //  })
      //  .catch(e => {
      //    console.log('auth err', e,action, args)
      //    if (cb) cb(e.message)
      //  })
    })

    socket.on('private',async function(action,args,cb){
      console.log('calling private',socket.user,action,...args)
      if(socket.user) socket.user = await users.get(socket.user.id)
      actions.private(socket.user,action, ...args)
        .then(result => {
          // console.log('result', result)
          if (cb) cb(null, result)
        })
        .catch(e => {
          console.log('private err', action, args,e)
          if (cb) cb(e.message)
        })
    })

    socket.on('admin',async function(action,args,cb){
      if(!socket.admin) return cb(new Error('You are not admin'))
      if(socket.user) socket.user = await users.get(socket.user.id)
      actions.admin(socket.user,action, ...args)
        .then(result => {
          // console.log('result', result)
          if (cb) cb(null, result)
        })
        .catch(e => {
          console.log('admin err', action, args,e)
          if (cb) cb(e.message)
        })
    })

    socket.on('public', async function(action, args, cb) {
      // console.log('socket call', action, args, socket.token)
      actions.public(undefined,action, ...args)
        .then(result => {
          // console.log('result', result)
          if (cb) cb(null, result)
        })
        .catch(e => {
          console.log('public err', action, args,e)
          if (cb) cb(e.message)
        })
    })
  })

  return {
    private(userid,...args){
      io.to(userid).emit('private',...args)
    },
    public(...args){
      io.emit('public',...args)
    },
    admin(...args){
      io.to('admin').emit('admin',...args)
    },
    authenticate(){
    },
  }
}
