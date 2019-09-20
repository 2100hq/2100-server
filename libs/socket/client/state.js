const lodash = require('lodash')
module.exports = (state,emit=x=>x) => (channel) => {
  return ([path=[],data])=>{
    if(path.length){
      if(data===null){
        lodash.unset(state[channel],path)
      }else{
        lodash.set(state[channel],path,data)
      }
    }else{
      state[channel] = data
    }
    emit(channel,state)
  }
}

