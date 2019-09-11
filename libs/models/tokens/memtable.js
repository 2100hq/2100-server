const Memtable = require('memtable')
const lodash = require('lodash')
module.exports = async (config, table, emit=x=>x) =>{

  const cache = Memtable({
    indexes:[
      {name:'name',required:true,unique:false,index:'name'},
      {name:'ownerAddress',required:true,unique:false,index:'ownerAddress'},
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
  function getByOwner(ownerAddress){
    return [...cache.getBy('ownerAddress',ownerAddress)]
  }
  function getByName(name){
    return [...cache.getBy('name',name)]
  }
  function hasAll(ids=[]){
    return lodash.every([...cache.hasAll(ids)])
  }

  return {
    ...table,
    get,
    set,
    getByOwner,
    getByName,
    // hasAll,
  }

}


