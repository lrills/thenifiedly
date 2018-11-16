const Benchmark = require('benchmark');
const thenifyAll = require('thenify-all');
const pify = require('pify');
const thenifiedly = require('../');

const fn = (arg1, arg2, callback) => {
  callback(null, arg1 + arg2);
};

const suite = new Benchmark.Suite('promisify method every time', {
  onError: console.error
});

const obj = { fn };

console.log('### Test promisify method every time:');
suite
  .add('thenify-all', () => {
    thenifyAll(obj, {}, ['fn']).fn('a', 'b');
  })
  .add('pify', () => {
    pify(obj).fn('a', 'b');
  })
  .add('thenifiedly.callMethod', () => {
    thenifiedly.callMethod('fn', obj, 'a', 'b');
  })
  .on('cycle', event => {
    console.log('  ' + String(event.target));
  });

suite.run();
