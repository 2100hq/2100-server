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
              query.privateState(socket.userid).then(state=>{
                io.to(socket.userid).emit('private',[],state)
              }).catch(err=>{
                console.log('err getting private state',err)
              })
              return cb(null, socket.userid)
            }catch(err){
              return cb(err.message)
            }
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

    // socket.on('admin',async function(action,args,cb){
    //   if(!socket.admin) return cb(new Error('You are not admin'))
    //   if(socket.user) socket.user = await users.get(socket.user.id)
    //   actions.admin(socket.user,action, ...args)
    //     .then(result => {
    //       // console.log('result', result)
    //       if (cb) cb(null, result)
    //     })
    //     .catch(e => {
    //       console.log('admin err', action, args,e)
    //       if (cb) cb(e.message)
    //     })
    // })

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
      console.log('emitting private',userid,...args)
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
