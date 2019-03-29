# thenifiedly

Promisifiedly call a callback style function/method with an es6 promise returned.

## Install

```shell
$ npm install thenifiedly
```

## Usage

```js
import http from 'http'
import thenifiedly from 'thenifiedly'

const endRes = thenifiedly.callMethod.bind(null, 'end')

http.createServer(async (req, res) => {
  const githubRes = await thenifiedly.call(
    http.get,
    'https://github.com'
  )

  await thenifiedly.callMethod('write', res, `GitHub is ${
    githubRes.statusCode < 300 ? 'ok': 'down'
  }! `)

  await endRes(res, 'Bye!')
  console.log('Response Ended!')
})
```

This is especially useful when the function/instance to use comes from callback arguments or generated dynamically each time. So you don't need to wrap it every time before use, and might gain small performance enhancement from it. Check [benchmark](#benchmark).

## API

### call: (fn[, ...args]) ⇒ `Promise`
Call a callback style function with postceding arguments, return a promise.

#### fn `Function`  
The function to be called.

#### args `any[]`  
Arguments to be passed to _fn_, except the most postceded callback.

```js
async () => {
  const statOfMe = await thenifiedly.call(fs.stat, '/tmp/me')
}
```

### callMethod: (method, instance[, ...args]) ⇒ `Promise`

#### method `string|Symbol`
The method name to be called on the _instance_ object.

#### instance `Object`
The object contains the _method_ to be called.

#### args `any[]`  
Arguments to be passed to _method_, except the most postceded callback.

```js
async () => {
  const worker = child_process.fork('some.js')
  await thenifiedly.callMethod('send', worker, { do: 'a job' })
}
```

### tillEvent: (event, emitter) ⇒ `Promise`
Return a promise which resolves once the specified event fired by the emitter.

#### event `string`  
The event name to be listened.

#### emitter `EventEmitter`  
A node _EventEmitter_ instance.

```js
async () => {
  await thenifiedly.tillEvent('connect', db)
}
```

### factory: (applier, options) ⇒ (...args) ⇒ `Promise`
Factory function to generate promisify helper for any kind of callback function.

#### applier: (callback, args) => void
Function to make arrange of the callback function applying.

##### callback: `Function`
Callback created by factory, you should inject it while calling.

##### args: `any[]`
Parameters passed to your generated helper function when using.

#### options `Object`

##### options.mutipleValues `boolean`  
Whether multiple values passed to the callback, an array of values would be resolved instead if set to true.
Default to `false`.

##### options.beginningError `boolean`  
Whether callback arguments begins with the first arg as the error thrown. Default to `true`.

##### options.promiseClass `boolean`  
The promise constructor to `new` the promise with. Default to native `Promise`.

```js
function sumUntilEach(cb, ...nums) {
  cb(
    ...nums.reduce((arr, n) => {
      const len = arr.length
      const last = len === 0 ? 0 : arr[len - 1]
      return arr.concat(last + n)
    }, [])
  )
}

const thenified = factory(
  (cb, args) => {
    sumUntilEach(cb, ...args)
  }, {
    mutipleValues: true,
    beginningError: false,
    promiseClass: MyPromise,
  })

await thenified(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
// [1, 3, 6, 10, 15, 21, 28, 36, 45, 55]
```

## Benchmark

Tested with node.js v10.8.0, check [./benchmarks](./benchmarks) for details.

```
### Test promisify function every time:
  util.promisify x 115,690 ops/sec ±2.69% (81 runs sampled)
  thenify x 226,758 ops/sec ±2.24% (82 runs sampled)
  es6-promisify x 1,433,982 ops/sec ±1.04% (80 runs sampled)
  pify x 1,969,359 ops/sec ±2.96% (77 runs sampled)
  thenifiedly.call x 3,704,139 ops/sec ±0.89% (84 runs sampled)

### Test promisify function once:
  util.promisify x 3,117,345 ops/sec ±0.86% (85 runs sampled)
  thenify x 3,529,109 ops/sec ±2.95% (83 runs sampled)
  es6-promisify x 1,559,947 ops/sec ±0.92% (83 runs sampled)
  pify x 3,164,405 ops/sec ±2.46% (82 runs sampled)
  thenifiedly.call x 3,724,577 ops/sec ±0.73% (83 runs sampled)

### Test promisify method every time:
  thenify-all x 204,321 ops/sec ±1.19% (82 runs sampled)
  pify x 1,494,615 ops/sec ±2.39% (82 runs sampled)
  thenifiedly.callMethod x 3,683,058 ops/sec ±0.75% (84 runs sampled)
  thenifiedly.callMethodFactory x 3,657,715 ops/sec ±2.42% (84 runs sampled)

### Test promisify method once:
  thenify-all x 3,591,625 ops/sec ±0.80% (86 runs sampled)
  pify x 3,628,348 ops/sec ±0.98% (80 runs sampled)
  thenifiedly.callMethod x 3,626,803 ops/sec ±2.34% (83 runs sampled)
  thenifiedly.callMethodFactory x 3,738,145 ops/sec ±0.98% (84 runs sampled)
```

## License

MIT
