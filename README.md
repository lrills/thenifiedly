# thenifiedly

Promisifiedly call a callback style function/method with an es6 promise returned.

```js
import http from 'http';
import thenifiedly from 'thenifiedly';

const callWrite = thenifiedly.callMethodFactory('write');

http.createServer(async (req, res) => {
  const ghRes = await thenifiedly.call(
    http.get,
    'https://github.com'
  );
  await callWrite(res, `GitHub is ${
    ghRes.statusCode < 300 ? 'ok': 'down'
  }! `);
  ghRes.destroy();

  await callMethod('end', res, 'Bye!');
  console.log('Response Ended!');
});
```

This is especially useful when the function/instance is from the parameters or returned dynamically. Thus you don't need to wrap it every time before use, and might gain small performance enhancement from it. Check [benchmark](#benchmark).

## API

### call: (fn, [...args]) ⇒ `Promise`
Call a callback style function with postceding arguments, return a promise.

#### fn `Function`  
The function to be called.

#### args `any[]`  
Arguments to be passed to _fn_, except the most postceded callback.

```js
async () => {
  const statOfMe = await thenifiedly.call(fs.stat, '/tmp/me');
}
```

### callMethod: (method, instance, [...args]) ⇒ `Promise`

#### method `string|Symbol`
The method name to be called on the _instance_ object.

#### instance `Object`
The object contains the _method_ to be called.

#### args `any[]`  
Arguments to be passed to _method_, except the most postceded callback.

```js
async () => {
  const worker = child_process.fork('some.js');
  await thenifiedly.callMethod('send', worker, { do: 'a job' });
}
```

### callMethodFactory: (method) ⇒ (instance, [...args]) ⇒ `Promise`
Make a method calling function with the method name specified.

#### method `string|Symbol`
The method name to be called on the _instance_ object.

#### instance `Object`
The object contains the _method_ to be called.

#### args `any[]`  
Arguments to be passed to method, except the postceded callback function.

```js
const callEnd = thenifiedly.callMethodFactory('end');

http.createServer(async (req, res) => {
  await callEnd(res, 'Hello world!');
  console.log('Finished!');
});
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
