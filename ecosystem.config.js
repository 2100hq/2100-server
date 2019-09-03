module.exports = {
  apps : [
    {
      name:'2100-auth',
      script:'./start.js',
      env:{
        service:'auth'
      }
    },
    {
      name:'2100',
      script:'./start.js',
      env:{
        service:'2100'
      }
    },
    {
      name:'2100-blocks',
      script:'./start.js',
      env:{
        service:'blocks'
      }
    },
  ]
}
