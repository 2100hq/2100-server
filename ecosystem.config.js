module.exports = {
  apps : [
    {
      name:'2100-auth',
      script:'./start.js',
      max_restarts:1,
      env:{
        service:'auth'
      }
    },
    {
      name:'2100',
      script:'./start.js',
      max_restarts:1,
      env:{
        service:'2100'
      }
    },
    {
      name:'2100-blocks',
      script:'./start.js',
      max_restarts:1,
      env:{
        service:'blocks'
      }
    },
  ]
}
