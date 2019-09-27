//stub to do some queries in memory
module.exports = config =>{
  let map = new Map()
  return {
    list(){
      return [...map.values()]
    },
    get(id){
     return map.get(id)
    },
    set(id,data){
      return map.set(id,data)
    },
    has(id){
      return map.has(id)
    },
    hasAll(ids=[]){
      return ids.reduce((result,id)=>{
        if(result === false){
          return result
        }
        return map.has(id)
      },true)
    },
    latest(){
      return [...map.values()].reduce((max,next)=>{
        if(max == null ) return next
        if(next.id > max.id) return next
      },{number:0})
    },
    clear(){
      map = new Map()
    },
    delete(id){
      map.delete(id)
    },
    getByToken(id){
      return [...map.values()].filter(x=>x.tokenid == id)
    },
    getByUser(userid){
      return [...map.values()].filter(x=>x.userid == userid)
    },
    between(start,end){
      return [...map.values()].filter(x=>x.id >= start && x.id < end)
    }
  }
}
