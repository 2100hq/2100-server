const assert = require('assert')

module.exports = (config,libs) => user =>{
  function echo(x){
    return x
  }
  function state(){
    return libs.query.publicState()
  }

  return {
    echo,
    state,
  }
}

