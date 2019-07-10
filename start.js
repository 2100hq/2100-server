require('dotenv').config()
const config = require('./libs/parseEnv')(process.env)
const Service = require('./libs/services')(config.service)

Service(config).then(x=>{
  console.log('Started',config.service)
}).catch(err=>{
  console.log('Service Error',config.service)
  console.log(err)
  process.exit(1)
})


