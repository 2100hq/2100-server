const Memtable = require('memtable')
const lodash = require('lodash')
const Defaults = require('./defaults')
const Schema = require('./schema')
const Validate = require('../validate')
const assert = require('assert')

module.exports = () => {
  const defaults = Defaults()
  const validate = Validate(Schema())

  const table = Memtable({
    indexes: [
      { name: 'type', index: 'type', required: false, unique: false },
      { name: 'username', index: 'username', required: false, unique: true },
    ],
  })

  function create(props) {
    assert(!has(props.id), 'User already exists with this id')
    const result = defaults(props)
    return set(result)
  }

  function set(user) {
    validate(user)
    return table.set(user)
  }

  function get(id) {
    const result = table.get(id)
    assert(result, 'User not found')
    return result
  }

  function has(id) {
    return table.has(id)
  }

  function getOrCreate(props) {
    try {
      return get(props.id)
    } catch (e) {
      return create(props)
    }
  }

  function byUsername(username) {
    return table.getBy('username', username)
  }

  function search(search = '', insensitive = false) {
    if (search.length < 2) return []
    if (insensitive) search = search.toUpperCase()

    const result = table.filter(x => {
      if (insensitive) {
        if (x.id.toUpperCase().includes(search)) return true
      } else {
        if (x.id.includes(search)) return true
      }

      if (x.expresstradeurl) {
        if (insensitive) {
          if (x.expresstradeurl.toUpperCase().includes(search)) return true
        } else {
          if (x.expresstradeurl.includes(search)) return true
        }
      }

      if (x.username) {
        if (insensitive) {
          if (x.username.toUpperCase().includes(search)) return true
        } else {
          if (x.username.includes(search)) return true
        }
      }

      if (x.opskinsid) {
        if (insensitive) {
          if (x.opskinsid.toUpperCase().includes(search)) return true
        } else {
          if (x.opskinsid.includes(search)) return true
        }
      }

      if (x.steam) {
        if (insensitive) {
          if (x.steam.steamid.toUpperCase().includes(search)) return true
          if (x.steam.profile.toUpperCase().includes(search)) return true
        } else {
          if (x.steam.steamid.includes(search)) return true
          if (x.steam.profile.includes(search)) return true
        }
      }
      return false
    })
    console.log('search', search, 'result', result)
    return result
  }

  function update(id, props) {
    const user = get(id)
    return set({ ...user, ...props })
  }

  function listBots() {
    return table.getBy('type', 'bot')
  }

  function list(index, id) {
    return [...table.values()]
  }

  return {
    list,
    create,
    set,
    get,
    has,
    update,
    byUsername,
    getOrCreate,
    listBots,
    search,
    stream() {
      return table.highland()
    },
  }
}
