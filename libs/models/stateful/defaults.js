module.exports = config => props => {
  return {
    state: 'Start',
    created: Date.now(),
    updated: Date.now(),
    done: false,
    ...props
  }
}
