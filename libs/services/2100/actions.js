const Actions = require('../../actions')

module.exports = (config,libs,emit=x=>x)=>{
  return {
    public:Actions('public',config,libs, emit.bind(emit,'public')),
    private:Actions('private',config,libs, emit.bind(emit,'private')),
    admin:Actions('admin',config,libs, emit.bind(emit,'admin')),
    auth:Actions('auth',config,libs, emit.bind(emit,'auth')),
    system:Actions('system',config,libs, emit.bind(emit,'system')),
  }
}

