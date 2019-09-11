const Memtable = require('memtable')
module.exports = async (config, table, emit=x=>x) =>{

  const cache = Memtable({
    indexes:[
      {name:'tokenid',required:true,unique:false,index:'tokenid'},
      {name:'userid',required:true,unique:false,index:'userid'},
    ],
  })

  await table.readStream().doto(x=>{
    cache.setSilent(x)
  }).last().toPromise(Promise)

  function get(id){
    return cache.get(id)
  }
  async function set(id,data){
    await table.set(id,data)
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

