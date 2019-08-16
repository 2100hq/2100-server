const lodash = require('lodash')
const assert = require('assert')
var Http = require('http')
var Socket = require('socket.io')

module.exports = async (config, actions) => {
  assert(actions, 'requires actions')

  assert(config.socket.port, 'requires socket port')

  var server = Http.createServer()
  var io = Socket(server, {})

  io.listen(config.socket.port)

  io.on('connection', socket => {
    // console.log('socket connect',socket.id)

    // socket.on('disconnect', function() {
    //   console.log('auth disconnect',socket.id)
    // })

    socket.on('auth',(method,args,cb=x=>x)=>{
      const id = lodash.uniqueId([socket.id,method,''].join(' '))
      console.time(id)
      actions(method,...args).then(x=>{
        console.timeEnd(id)
        cb(null,x)
      }).catch(err=>{
        console.timeEnd(id)
        cb(err.message)
      })
    })
  })
}

