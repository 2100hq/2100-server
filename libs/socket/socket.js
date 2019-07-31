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
  assert(config.systemAddress,'requires system address')
  assert(config.socket.port, 'requires socket port')

  var server = Http.createServer()
  var io = Socket(server, {})

  io.listen(config.socket.port)
  const batching = new Map()

  io.on('connection', socket => {

    socket.token = libs.ethers.utils.hashMessage(socket.id)

    // console.log('connected',socket.id,socket.token)
    socket.on('disconnect', function() {
      console.log('disconnect',socket.user)
    })

    query.publicState().then(state=>io.emit('public',[],state)).catch(err=>{
      console.log('error getting public state',err)
    })

    socket.on('auth',(action,args,cb=x=>x)=>{
      // console.log('auth message',socket.id,action,args)
      switch(action){
          case 'token':
            return cb(null,socket.token)
          case 'authenticate':
            const [signed,address] = args
            let valid = false
            try{
              valid = libs.authenticate(socket.token,signed,address)
              assert(valid,'Authentication Failed')
              socket.userid = address.toLowerCase()
              socket.join(socket.userid)
              libs.users.getOrCreate(socket.userid).then(user=>{
                return query.privateState(socket.userid)
              }).then(state=>{
                io.to(socket.userid).emit('private',[],state)
              }).catch(err=>{
                console.log('err getting private state',err)
              })
              return cb(null, socket.userid)
            }catch(err){
              return cb(err.message)
            }
          case 'unauthenticate':
            if(socket.userid == null) return cb(null, {})
            io.to(socket.userid).emit('private',[],{})
            socket.leave(socket.userid)
            delete socket.userid
            return cb(null, {})
          default:
            return cb(`${action} is not recognized`)
      }
    })

    socket.on('private',function(action,args,cb=x=>x){
      if(socket.userid == null) return cb('Please Login')
      libs.users.getOrCreate(socket.userid).then(async user=>{
        console.log('calling private',user,action,...args)
        cb(null, await actions.private(user,action, ...args))
      }).catch(err=>{
        console.log('private err', action, args,err)
        if (cb) cb(err.message)
      })
    })

    socket.on('admin',async function(action,args,cb){
      if(socket.userid == null) return cb('Please Login')
      libs.users.getOrCreate(socket.userid).then(async user=>{
        assert(user.isAdmin,'You are not an admin')
        console.log('calling admin',user,action,...args)
        cb(null, await actions.admin(user,action, ...args))
      }).catch(err=>{
        console.log('admin err', action, args, err)
        if (cb) cb(err.message)
      })
    })

    socket.on('system',async function(action,args,cb){
      if(socket.userid == null) return cb('Please Login')
      if(config.systemAddress == null) return cb('System address has not been set')
      libs.users.getOrCreate(socket.userid).then(async user=>{
        assert(user.id.toLowerCase() === config.systemAddress.toLowerCase(),'Not Authorized')
        console.log('calling system',user,action,...args)
        cb(null, await actions.system(user,action, ...args))
      }).catch(err=>{
        console.log('system err', action, args,err)
        if (cb) cb(err.message)
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
      // console.log('emitting private',userid,...args)
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
