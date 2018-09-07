const Benchmark = require('benchmark');
const util = require('util');
const thenify = require('thenify');
const { promisify } = require('es6-promisify');
const pify = require('pify');
const thenifiedly = require('../');

const fn = (arg1, arg2, callback) => {
  callback(null, arg1 + arg2);
};

const suite = new Benchmark.Suite('promisify function once', {
  onError: console.error
});

const utilPromisifidFn = util.promisify(fn);
const thenifiedFn = thenify(fn);
const promisifiedFn = promisify(fn);
const pifiedFn = pify(fn);

console.log('### Test promisify function once:');
suite
  .add('util.promisify', () => {
    utilPromisifidFn('a', 'b');
  })
  .add('thenify', () => {
    thenifiedFn('a', 'b');
  })
  .add('es6-promisify', () => {
    promisifiedFn('a', 'b');
  })
  .add('pify', () => {
    pifiedFn('a', 'b');
  })
  .add('thenifiedly.call', () => {
    thenifiedly.call(fn, 'a', 'b');
  })
  .on('cycle', event => {
    console.log('  ' + String(event.target));
  });

suite.run();
