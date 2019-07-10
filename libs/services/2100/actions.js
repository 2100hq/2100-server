const Actions = require('../../actions')

module.exports = (config,libs,emit=x=>x)=>{
  return {
    public:Actions('public',config,libs),
    private:Actions('private',config,libs),
    admin:Actions('admin',config,libs),
    auth:Actions('auth',config,libs),
  }
}

