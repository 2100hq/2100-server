module.exports = () => {
  return (props = {}) => {
    return {
      created:Date.now(),
      stats:{},
      ...props,
      updated:Date.now(),
    }
  }
}

