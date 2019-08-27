const { Table } = require('../../utils').Rethink
const assert = require('assert')

module.exports = async (config, con) => {
  assert(config.table, 'requires table name')

  const schema = {
    table: config.table,
    indices:['type','done'],
    compound:[
      {name:'typeDone',fields:['type','done']},
      {name:'userDone',fields:['userid','done']}
    ]
  }

  const table = await Table(con, schema)

  return {
    ...table,
    set(id,data){
      return table.upsert(data)
    },
    getDone(done=false){
      return table.getBy('done',done)
    },
    getUserDone(userid,done=false,start=0,length,desc=true){
      assert(userid,'requires userid')
      const query = table.table().getAll([userid,done],{index:'userDone'})

      return table.streamify(query)
        .sortBy(function(a,b){
          if(desc){
            return b.id > a.id ? 1 : -1
          }else{
            return b.id < a.id ? 1 : -1
          }
        })
        .slice(start,length)
        .collect()
        .toPromise(Promise)
    },
    getTypeDone(type,done=false){
      assert(type,'requires command type')
      return table.getBy('typeDone',[type,done])
    },
    countDone(done=false){
      const query = table.table().getAll(done,{index:'done'}).count()
      return table.run(query)
    },
    readStream(done=false){
      const query = table.table().getAll(done,{index:'done'})
      return table.streamify(query)
    },
    insert(many){
      console.log('many',many.length)
      const query = table.table().insert(many,{return_changes:false,conflict:'error'})
      return table.run(query)
    }
  }
}




