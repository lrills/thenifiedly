const Benchmark = require('benchmark')
const util = require('util')
const thenify = require('thenify')
const { promisify } = require('es6-promisify')
const pify = require('pify')
const thenifiedly = require('../')

const fn = (arg1, arg2, callback) => {
  callback(null, arg1 + arg2)
}

const suite = new Benchmark.Suite('promisify function every time', {
  onError: console.error,
})

console.log('### Test promisify function every time:')
suite
  .add('util.promisify', () => {
    util.promisify(fn)('a', 'b')
  })
  .add('thenify', () => {
    thenify(fn)('a', 'b')
  })
  .add('es6-promisify', () => {
    promisify(fn)('a', 'b')
  })
  .add('pify', () => {
    pify(fn)('a', 'b')
  })
  .add('thenifiedly.call', () => {
    thenifiedly.call(fn, 'a', 'b')
  })
  .on('cycle', event => {
    console.log('  ' + String(event.target))
  })

suite.run()
