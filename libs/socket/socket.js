const lodash = require('lodash')
const assert = require('assert')
const Http = require('http')
const Socket = require('socket.io')
const highland = require('highland')

module.exports = async (config, libs,emit=x=>x) => {
  const {actions,events,query,users,auth} = libs
  assert(actions, 'requires actions')
  assert(actions.private, 'requires private actions')
  assert(actions.public, 'requires public actions')
  assert(actions.admin, 'requires admin actions')
  assert(actions.auth,'requires auth actions')
  // assert(events, 'requires events library')
  assert(query, 'requires query library')
  assert(users, 'requires users library')
  // assert(services.private, 'requires private service')
  // assert(services.admin, 'requires admin service')
  assert(config.systemAddress,'requires system address')
  assert(config.socket.port, 'requires socket port')

  const server = Http.createServer()
  const io = Socket(server, {})

  io.listen(config.socket.port)

  const userStreams = new Map()
  const publicStream = highland()
  const adminStream = highland()

  io.on('connection', socket => {

    emit('connect',socket.id)
    socket.on('disconnect', function() {
      // console.log('disconnect',socket.user)
      emit('disconnect',socket.id)
    })

    // console.log('socket online',socket.id)
    query.publicState().then( state=>{
      // console.log('public state',state)
      // publicStream.write([[],state])
      socket.emit('public',[[[],state]])
    }).catch(err=>{
      console.log('error getting public state',err)
    })

    socket.on('auth',(action,args,cb=x=>x)=>{
      //passing in the socket as the user, this will act
      //like a writeable session object within the action code
      actions.auth(socket,action,...args).then(result=>{
        cb(null, result)
      }).catch(err=>{
        // console.log('auth error',err)
        if (cb) cb(err.message)
      })
    })

    socket.on('private',function(action,args,cb=x=>x){
      if(socket.userid == null) return cb('Please Login')
      libs.users.getOrCreate(socket.userid).then(async user=>{
        cb(null, await actions.private(user,action, ...args))
      }).catch(err=>{
        if (cb) cb(err.message)
      })
    })

    socket.on('admin',async function(action,args,cb){
      console.log('admin',socket.userid)
      if(socket.userid == null) return cb('Please Login')
      libs.users.getOrCreate(socket.userid).then(async user=>{
        assert(user.isAdmin,'You are not an admin')
        cb(null, await actions.admin(user,action, ...args))
      }).catch(err=>{
        if (cb) cb(err.message)
      })
    })

    socket.on('system',async function(action,args,cb){
      console.log('system',socket.userid)
      if(socket.userid == null) return cb('Please Login')
      if(config.systemAddress == null) return cb('System address has not been set')
      console.log('action',action,'userid',socket.userid,'systemaddress',config.systemAddress)
      libs.users.getOrCreate(socket.userid).then(async user=>{
        assert(user.id.toLowerCase() === config.systemAddress.toLowerCase(),'Not Authorized')
        cb(null, await actions.system(user,action, ...args))
      }).catch(err=>{
        if (cb) cb(err.message)
      })
    })

    socket.on('public', async function(action, args, cb) {
      actions.public(undefined,action, ...args)
        .then(result => {
          if (cb) cb(null, result)
        })
        .catch(e => {
          if (cb) cb(e.message)
        })
    })
  })
  let {batch=500,batchTime=500} = config

  batch = parseInt(batch)
  batchTime= parseInt(batchTime)


  function getUserStream(userid,io){
    if(userStreams.has(userid)) return userStreams.get(userid)
    const stream = highland()

    stream
      // .doto(args=>console.log(...args))
      .batchWithTimeOrCount(batchTime,batch)
      .errors((err,push)=>{
        console.log(err)
        process.exit(1)
      })
      .each(batch=>{
        // console.log('private',userid,batch)
        io.to(userid).emit('private',batch)
      })

    userStreams.set(userid,stream)
    return stream
  }


  publicStream
    .batchWithTimeOrCount(batchTime,batch)
    .errors((err,push)=>{
      console.log(err)
      process.exit(1)
    })
    .each(batch=>{
      // console.log('public',batch)
      io.emit('public',batch)
    })
    

  adminStream
    .batchWithTimeOrCount(batchTime,batch)
    .errors((err,push)=>{
      console.log(err)
      process.exit(1)
    })
    .each(batch=>{
      console.log('admin',batch.length)
      io.to('admin').emit('admin',batch)
    })

  return {
    leave(sessionid,channel){
      assert(io.sockets.connected[sessionid],'session not connected')
      const socket = io.sockets.connected[sessionid]
      return new Promise((res,rej)=>socket.leave(channel,err=>{
        if(err) return rej(err)
        res()
      }))
    },
    join(sessionid,channel){
      assert(io.sockets.connected[sessionid],'session not connected')
      const socket = io.sockets.connected[sessionid]
      return new Promise((res,rej)=>socket.join(channel,err=>{
        if(err) return rej(err)
        res()
      }))
    },
    private(userid,...args){
      getUserStream(userid,io).write(args)
    },
    public(...args){
      publicStream.write(args)
      // io.emit('public',...args)
    },
    admin(...args){
      adminStream.write(args)
      // io.to('admin').emit('admin',...args)
    },
  }
}
