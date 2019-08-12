const uuid = require('uuid/v4')
module.exports = () => {
  return (props = {}) => {
    return {
      id: uuid(),
      favorites:[],
      ...props,
    }
  }
}
