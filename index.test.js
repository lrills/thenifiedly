const EventEmitter = require('events');
const moxy = require('moxy').default;
const thenifiedly = require('./');

jest.useFakeTimers();

const delay = n => new Promise(resolve => setTimeout(resolve, n));
const resolvingSpy = moxy(x => x);

beforeEach(() => {
  resolvingSpy.mock.clear();
});

describe('thenifiedly.factory(applier, options)(...args)', () => {
  const applier = moxy();

  beforeEach(() => {
    applier.mock.clear();
  });

  it('resolve 2nd callback value by default', async () => {
    const promise = thenifiedly
      .factory(applier)('foo', 'bar', 'baz')
      .then(resolvingSpy);

    expect(promise).toBeInstanceOf(Promise);

    jest.advanceTimersByTime(10);
    expect(resolvingSpy.mock).not.toHaveBeenCalled();

    expect(applier.mock).toHaveBeenCalledTimes(1);
    const [callback, applyingArgs] = applier.mock.calls[0].args;
    expect(applyingArgs).toEqual(['foo', 'bar', 'baz']);

    callback(null, 'hello', 'world');
    jest.runAllTimers();

    await expect(promise).resolves.toBe('hello');
    expect(resolvingSpy.mock).toHaveBeenCalled();
  });

  it('rejects with 1st arg by default', async () => {
    const promise = thenifiedly.factory(applier)('foo', 'bar', 'baz');
    expect(promise).toBeInstanceOf(Promise);

    jest.advanceTimersByTime(10);

    expect(applier.mock).toHaveBeenCalledTimes(1);
    const [callback, applyingArgs] = applier.mock.calls[0].args;
    expect(applyingArgs).toEqual(['foo', 'bar', 'baz']);

    callback('hello', 'world');
    jest.runAllTimers();

    await expect(promise).rejects.toBe('hello');
  });

  it('return promise instance of promiseClass', () => {
    const MyPromise = moxy();

    expect(
      thenifiedly.factory(applier, { promiseClass: MyPromise })('foo')
    ).toBeInstanceOf(MyPromise);

    expect(
      thenifiedly.factory(applier, {
        mutipleValues: true,
        beginningError: false,
        promiseClass: MyPromise
      })('foo')
    ).toBeInstanceOf(MyPromise);

    expect(MyPromise.mock).toHaveBeenCalledTimes(2)
  });

  describe.each`
    multiVal | beginErr | callbackParams  | resolving | expectedValue
    ${true}  | ${true}  | ${[null, 2, 3]} | ${true}   | ${[2, 3]}
    ${true}  | ${true}  | ${[1, 2, 3]}    | ${false}  | ${1}
    ${true}  | ${false} | ${[1, 2, 3]}    | ${true}   | ${[1, 2, 3]}
    ${false} | ${true}  | ${[null, 2, 3]} | ${true}   | ${2}
    ${false} | ${true}  | ${[1, 2, 3]}    | ${false}  | ${1}
    ${false} | ${false} | ${[1, 2, 3]}    | ${true}   | ${1}
  `(
    'when { mutipleValues: $multiVal, beginningError: $beginErr }',
    ({ multiVal, beginErr, callbackParams, resolving, expectedValue }) => {
      const applier = moxy();

      beforeEach(() => {
        applier.mock.clear();
      });

      it(`${resolving ? 'resolves' : 'rejects'} as expected`, async () => {
        const promise = thenifiedly
          .factory(applier, {
            mutipleValues: multiVal,
            beginningError: beginErr
          })('foo', 'bar', 'baz')
          .then(resolvingSpy);

        jest.advanceTimersByTime(10);
        expect(resolvingSpy.mock).not.toHaveBeenCalled();

        expect(applier.mock).toHaveBeenCalledTimes(1);
        const [callback, applyingArgs] = applier.mock.calls[0].args;
        expect(applyingArgs).toEqual(['foo', 'bar', 'baz']);

        callback(...callbackParams);
        jest.runAllTimers();

        if (resolving) {
          await expect(promise).resolves.toEqual(expectedValue);
          expect(resolvingSpy.mock).toHaveBeenCalled();
        } else {
          await expect(promise).rejects.toEqual(expectedValue);
        }
      });
    }
  );
});

describe('thenifiedly.call(fn, ...args)', () => {
  it('resolves value passed to callback', async () => {
    const sumAsync = moxy((x, y, cb) => {
      setTimeout(cb, 100, null, x + y);
    });

    const promise = thenifiedly.call(sumAsync, 1, 2).then(resolvingSpy);

    jest.advanceTimersByTime(50);
    expect(resolvingSpy.mock).not.toHaveBeenCalled();
    jest.runAllTimers();

    await expect(promise).resolves.toBe(3);
    expect(resolvingSpy.mock).toHaveBeenCalled();

    expect(sumAsync.mock).toHaveBeenCalledTimes(1);
    expect(sumAsync.mock).toHaveBeenCalledWith(1, 2, expect.any(Function));
  });

  it('works with dynamic length function', async () => {
    const sumAsync = moxy((...args) => {
      const nums = args.slice(0, -1);
      const cb = args[args.length - 1];

      const sum = nums.reduce((a, b) => a + b);
      setTimeout(cb, 100, null, sum);
    });

    const promise = thenifiedly.call(sumAsync, 1, 2, 3, 4).then(resolvingSpy);

    jest.advanceTimersByTime(50);
    expect(resolvingSpy.mock).not.toHaveBeenCalled();
    jest.runAllTimers();

    await expect(promise).resolves.toBe(10);
    expect(resolvingSpy.mock).toHaveBeenCalled();

    const { mock } = sumAsync;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(1, 2, 3, 4, expect.any(Function));
  });

  it('rejects with error passed to callback', async () => {
    const sumAsync = moxy((x, y, cb) => {
      setTimeout(cb, 100, new TypeError('nononono'));
    });

    const promise = thenifiedly.call(sumAsync, '1', '2').then(resolvingSpy);
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(new TypeError('nononono'));
    expect(resolvingSpy.mock).not.toHaveBeenCalled();

    expect(sumAsync.mock).toHaveBeenCalledTimes(1);
    expect(sumAsync.mock).toHaveBeenCalledWith('1', '2', expect.any(Function));
  });
});

describe('thenifiedly.callMethod(method, instance, ...args)', () => {
  it('resolves value passed to callback', async () => {
    const instance = moxy({
      sumAsync: (x, y, cb) => {
        setTimeout(cb, 100, null, x + y);
      }
    });

    const promise = thenifiedly
      .callMethod('sumAsync', instance, 1, 2)
      .then(resolvingSpy);

    jest.advanceTimersByTime(50);
    expect(resolvingSpy.mock).not.toHaveBeenCalled();
    jest.runAllTimers();

    await expect(promise).resolves.toBe(3);
    expect(resolvingSpy.mock).toHaveBeenCalled();

    const { mock } = instance.sumAsync;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(1, 2, expect.any(Function));
    expect(mock.calls[0].instance).toBe(instance);
  });

  it('works with dynamic length function', async () => {
    const instance = moxy({
      sumAsync: (...args) => {
        const nums = args.slice(0, -1);
        const cb = args[args.length - 1];

        const sum = nums.reduce((a, b) => a + b);
        setTimeout(cb, 10, null, sum);
      }
    });

    const promise = thenifiedly
      .callMethod('sumAsync', instance, 1, 2, 3, 4)
      .then(resolvingSpy);

    jest.advanceTimersByTime(50);
    expect(resolvingSpy.mock).not.toHaveBeenCalled();
    jest.runAllTimers();

    await expect(promise).resolves.toBe(10);
    expect(resolvingSpy.mock).toHaveBeenCalled();

    const { mock } = instance.sumAsync;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(1, 2, 3, 4, expect.any(Function));
    expect(mock.calls[0].instance).toBe(instance);
  });

  it('rejects with error passed to callback', async () => {
    const instance = moxy({
      sumAsync: (x, y, cb) => {
        setTimeout(cb, 100, new TypeError('nononono'));
      }
    });

    const promise = thenifiedly
      .callMethod('sumAsync', instance, '1', '2')
      .then(resolvingSpy);
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(new TypeError('nononono'));
    expect(resolvingSpy.mock).not.toHaveBeenCalled();

    const { mock } = instance.sumAsync;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith('1', '2', expect.any(Function));
    expect(mock.calls[0].instance).toBe(instance);
  });
});

describe('thenifiedly.tillEvent(event, emitter)', () => {
  it('resolves first arg of listner when event emited', async () => {
    const emitter = new EventEmitter();

    const promise = thenifiedly.tillEvent('foo', emitter).then(resolvingSpy);

    jest.advanceTimersByTime(50);
    expect(resolvingSpy.mock).not.toHaveBeenCalled();

    emitter.emit('foo', 'bar', 'baz');
    emitter.emit('foo', 'baz');
    jest.runAllTimers();

    await expect(promise).resolves.toBe('bar');
    expect(resolvingSpy.mock).toHaveBeenCalled();
  });
});
