const Benchmark = require('benchmark')
const thenifyAll = require('thenify-all')
const pify = require('pify')
const thenifiedly = require('../')

const fn = (arg1, arg2, callback) => {
  callback(null, arg1 + arg2)
}

const suite = new Benchmark.Suite('promisify method once', {
  onError: console.error,
})

const obj = { fn }
const pifiedObj = pify(obj)
const thenifiedObj = thenifyAll(obj, {}, ['fn'])

console.log('### Test promisify method once:')
suite
  .add('thenify-all', () => {
    thenifiedObj.fn('a', 'b')
  })
  .add('pify', () => {
    pifiedObj.fn('a', 'b')
  })
  .add('thenifiedly.callMethod', () => {
    thenifiedly.callMethod('fn', obj, 'a', 'b')
  })
  .on('cycle', event => {
    console.log('  ' + String(event.target))
  })

suite.run()
