const test = require('tape')
const utils = require('../libs/utils')

test('utils',t=>{
  t.test('regexAddress',t=>{
    t.notOk(utils.regexAddress.test('0x1F6186932b5A0d1400C457F5f8D457578A2a6F8E'))
    t.notOk(utils.regexAddress.test('1F6186932b5A0d1400C457F5f8D457578A2a6F8E'.toLowerCase()))
    t.ok(utils.regexAddress.test('0x1F6186932b5A0d1400C457F5f8D457578A2a6F8E'.toLowerCase()))
    t.end()
  })
  t.test('regexTwitter',t=>{
    t.notOk(utils.regexTwitter.test('hello.'))
    t.notOk(utils.regexTwitter.test('Hello'))
    t.ok(utils.regexTwitter.test('a'))
    t.notOk(utils.regexTwitter.test('aaaaaaaaaaaaaaaaaaaaaaa'))
    t.ok(utils.regexTwitter.test('valid'))
    t.ok(utils.regexTwitter.test('valid_123'))
    t.end()
  })
  t.test('parseTweet',async t=>{
    const text = await utils.parseTweet("https://twitter.com/brttb/status/1148414458567569411")
    t.ok(text)
    t.end()
  })
  t.test('parseTwittername',async t=>{
    const text = await utils.parseTwitterUser("https://twitter.com/brttb/status/1148414458567569411")
    t.equal(text,'brttb')
    t.end()
  })
  t.test('matchTweet',async t=>{
    const text = await utils.parseTweet("https://twitter.com/brttb/status/1148414458567569411")
    const result = utils.matchTweet(text,"Every pirate wants to be an admiral -Doctorow")
    t.ok(result)
    t.end()
  })
})
