const lodash = require('lodash')
const assert = require('assert')
const pad = require('pad')
const Rethink = require('rethinkdb')
const bn = require('bignumber.js')
const axios = require('axios')
const cheerio = require('cheerio')
const URL = require('url');
const ethers = require('ethers')

exports.bn = bn
exports.regexAddress = /^0x[a-f0-9]+$/
exports.regexLowerNum = /^[a-z0-9]+$/
exports.regexLowerUrl = /^[a-z0-9_-]+$/
exports.regexTwitter = /^[a-z0-9_]{1,15}$/

//validate stakes ad up to 1 or less and that they are positive
exports.validateStakes = (stakes,max=1,min=0)=>{
  // console.log('validate stakes',stakes,max,min)
  assert(lodash.size(stakes) > 0,'Requires at least 1 stake')
  assert(lodash.every(lodash.values(stakes),lodash.isString),'Stakes must be denoted as numerical strings')
  assert(bn.sum(...lodash.values(stakes)).isLessThanOrEqualTo(max),'Stakes exceed available balance')
  assert(lodash.every(stakes,value=>bn(value).isInteger()),'Stakes must be an integer')
  assert(lodash.every(stakes,value=>bn(value).isGreaterThanOrEqualTo(min)),'Stakes must be 0 or greater')
  return stakes
}

exports.stringToInt = (val,mul=100000)=>{
  // console.log('stringtoint',val)
  if(val === '0') return 0
  if(val) return parseInt(parseFloat(ethers.utils.formatEther(val)) * mul)
  // if(val) return parseInt(val.slice(0,length))
}

exports.intToString = (val,div=100000) =>{

  if(val === 0) return '0'
  if(val) return ethers.utils.parseEther((val/div).toString()).toString()
  // if(val) return pad(val.toString(),decimals,'0')
}

exports.validateStakesInt = (stakes,max=1,min=0)=>{
  stakes = Object.values(stakes)
  assert(stakes.length > 0,'Requires at least 1 stake')
  assert(lodash.every(stakes,lodash.isFinite),'Stakes must be denoted as numbers')
  assert(lodash.every(stakes,value=>value>=min),'Stakes must be 0 or greater')
  return stakes
}

exports.diffStakes = (prev,next)=>{
  const keys = lodash.uniq([...Object.keys(prev),...Object.keys(next)])
  return keys.reduce((result,key)=>{
    if(prev[key] == next[key]) return result
    result[key] = next[key]
    return result
  },{})
}

exports.Benchmark = (benchmarks={})=>{
  benchmarks = {
    new:0,
    completed:0,
    seconds:1,
    ...benchmarks
  }

  return {
    new(){
      benchmarks.new++
    },
    completed(){
      benchmarks.completed++
    },
    print(){
      // const pendingCount = await libs.commands.countDone(false)
      // benchmarks.pending = pendingCount
      benchmarks.perSecond = (benchmarks.completed/benchmarks.seconds).toFixed(2)
      if(benchmarks.completed) benchmarks.avg = (benchmarks.seconds * 1000 / benchmarks.completed).toFixed(2) + 'ms'
      console.table(benchmarks)
    },
    clear(){
      benchmarks.new = 0
      benchmarks.completed = 0
      benchmarks.perSecond = 0
      benchmarks.avg = 0
    }
  }
}

exports.BenchTimer = ({length=10}) =>{
  const samples =[]
  let index = 0
  return {
    start(now=Date.now()){
      samples[index] = [now]
    },
    end(now=Date.now()){
      samples[index].push(now)
      index ++ 
      if(index >= length){
        index = 0
      }
    },
    avg(){
      if(samples.length === 0) return 0
      return lodash(samples).filter(([start,end])=>{
        return start && end
      }).sumBy(([start,end])=>{
        return end - start
      })/samples.length
    },
    length(){
      return samples.length
    }
  }
}

exports.parseTweet = async url =>{
  const resp = await axios.get(url)
  const dom = cheerio.load(resp.data);
  const text = dom('title').text()
  return text
}
exports.parseTwitterUser = url =>{
  return URL.parse(url).pathname.split('/')[1]
}

exports.matchTweet = (tweet,match)=>{
  return new RegExp(match, 'i').test(tweet)
}

exports.tweetTemplates = {
  '2100': 'Add me to @2100hq using the Ethereum address publicAddress',
  'humanitydao': "I'm applying to the @HumanityDAO registry! My Ethereum address is publicAddress"
}
exports.validateTweet = async (url,publicAddress,template) =>{
  let name = exports.parseTwitterUser(url)
  assert(name,'Unable get Twitter username')
  name = name.toLowerCase()
  const text = template.replace(/publicAddress/, publicAddress)
  const tweet = await exports.parseTweet(url)
  const match = exports.matchTweet(tweet,text)
  assert(match,'Tweet does not match required text')
  return name.toLowerCase()
}

exports.GetWallets = wallets => type =>{
  assert(wallets,'requires wallet type tables')
  assert(type,'requires wallet type')
  assert(wallets[type],'No wallets by type: ' + type)
  return wallets[type]
}

exports.parseError = err => {
  assert(err.message,'error requires message')
  assert(err.stack, 'error requires stack')
  return {
    message:err.message,
    stack:err.stack,
  }
}

exports.stakeid = (userid,tokenid) =>{
  assert(userid,'requires userid')
  assert(tokenid,'requires tokenid')
  return [userid,tokenid].join('!')
}

exports.blockid = (number)=>{
  return pad(number.toString(),16,'0')
}
exports.eventid = (address,number,index)=>{
  assert(address,'requires contract address')
  assert(number,'requires block number')
  assert(index >= 0,'index must be a positive number')
  return [pad(16,number,'0'),pad(16,index,'0'),address].join('!')
}

exports.stringifyValues = (object)=>{
  return lodash.mapValues(object,val=>{
    return val.toString()
  })
}

exports.IncreasingId = (start=0,max=10000000)=>{
  let nonce = start
  return (now=Date.now())=>{
    const id = [now,pad(8,nonce,'0')].join('!')
    nonce = (nonce + 1) % max
    return id
  }
}

exports.walletId = function(userid,tokenid){
  assert(userid,'requries user address')
  assert(tokenid,'requires token address')
  return [userid.toLowerCase(),tokenid.toLowerCase()].join('!')
}

//singelton
let rethinkConnection = null
exports.RethinkConnection = async config => {
  assert(config, 'requires rethink config')
  assert(config.db, 'requires rethink.db')
  if (rethinkConnection) return rethinkConnection
  rethinkConnection = await Rethink.connect(config)
  return exports.Rethink.Utils.createDB(rethinkConnection, config.db)
}

exports.Rethink = require('rethink-table')

exports.calculateStakes = (token,stakers)=>{
  const totalStaked = lodash.sumBy(stakers,'value')
  return stakers.map(({address,value})=>{
    return {
      token:token.name,
      to:address,
      value:value/totalStaked * token.reward
    }
  })
}

exports.sleep = ms =>{
  return new Promise(res=>setTimeout(res,ms))
}

exports.loop = async (fn, delay = 1000, max, count = 0, result) => {
  assert(lodash.isFunction(fn), 'loop requires a function')
  if (max && count >= max) return result
  result = await fn(count)
  await new Promise(res => setTimeout(res, delay))
  return exports.loop(fn, delay, max, count + 1, result)
}
