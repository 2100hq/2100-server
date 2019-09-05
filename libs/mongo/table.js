const Promise = require('bluebird')
const assert = require('assert')
const highland = require('highland')
module.exports = async (db,schema) =>{
  const {table,indices=[],compound=[]} = schema

  function createCollection(name){
    return db.createCollection(name).catch(err=>{
      console.log(err.message)
    })
  }

  function createIndex(collection,name){
    return collection.createIndex({
      [name]:1
    })
  }

  function createIndexes(collection,indexes){
    return Promise.mapSeries(indexes,index=>{
      return createIndex(collection,index)
    })
  }

  function createCompoundIndex(collection,name,fields){
    const config = fields.reduce((result,name)=>{
      result[name] = 1
      return result
    },{})
    return collection.createIndex(config)
  }

  function createCompoundIndexes(collection,indexes){
    return Promise.mapSeries(indexes,index=>{
      return createIndex(collection,index.name,index.fields)
    })
  }
  
  await createCollection(table)
  const col = db.collection(table)
  await createIndexes(col,indices)
  await createCompoundIndexes(col,compound)

  async function get(id){
      assert(id, 'requires id')
      return col.findOne({
        _id: id
      })
  }
  async function has(id){
    const result = await col.findOne({_id:id},{projection:{'_id':1}})
    return result ? true : false
  }
  async function set(id,props){
    props._id = id
    await col.updateOne({ _id: id }, { $set: props }, { upsert: true })
    return props
  }
  async function getBy(data,options){
    return col.find(data,options).toArray()
  }
  async function del(id){
    await con.deleteOne({ _id: id })
    return { _id: id, id }
  }
  function count(props){
    return col.countDocuments(props)
  }
  function streamify(cursor){
    return cursor
  }
  function insertMany(docs=[]){
    docs = docs.map(x=> {
      x._id = x.id
      return x
    })
    return col.insertMany(docs)
  }
  function drop(){
    return col.deleteMany({})
  }
  function query(){
    return col
  }
  function list(){
    return col.find({}).toArray()
  }

  return {
    set,get,getBy,has,delete:del,streamify,count,drop,insertMany,query,list
  }
}
