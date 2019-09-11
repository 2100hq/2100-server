const Memtable = require('memtable')
const highland = require('highland')
module.exports = async (config, table, emit=x=>x) =>{

  const cache = Memtable({
    indexes:[
      {name:'tokenid',required:true,unique:false,index:'tokenid'},
      {name:'userid',required:true,unique:false,index:'userid'},
    ],
  })

  const saveStream = highland()

  saveStream
    // .batchWithTimeOrCount(100,100)
    .map(x=>table.set(x.id,x))
    .flatMap(highland)
    // .doto(x=>console.log('saving wallets',x.id))
    .errors(err=>{
      console.log('wallets',err)
    })
    // .doto(x=>{
    //   console.log('saved',x)
    // })
    .resume()

  await table.readStream().doto(x=>{
    cache.setSilent(x)
  }).last().toPromise(Promise)

  function get(id){
    return cache.get(id)
  }
  async function set(id,data){
    // await table.set(id,data)
    saveStream.write(data)
    return cache.set(data)
  }
  function getByUser(userid){
    return [...cache.getBy('userid',userid)]
  }
  function getByToken(tokenid){
    return [...cache.getBy('tokenid',tokenid)]
  }

  return {
    ...table,
    get,
    set,
    getByUser,
    getByToken,
  }

}

