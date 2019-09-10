module.exports = config => props => {
  return {
    state: 'Start',
    created: Date.now(),
    done: false,
    ...props,
    updated: Date.now(),
  }
}
