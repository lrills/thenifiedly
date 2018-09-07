const thenifiedly = require('./');

test.each(['call', 'callMethod', 'callMethodFactory'])(
  '%s is function',
  prop => {
    expect(typeof thenifiedly[prop]).toBe('function');
  }
);

describe('callMethodFactory()', () => {
  it('return wrapped function', () => {
    const factory = thenifiedly.callMethodFactory('method');
    expect(typeof factory).toBe('function');
    expect(factory.name).toBe('thenifiedlyCallMethod');
  });
});

const fn = jest.fn();
const makeFunctionCalls = () => [
  thenifiedly.call(fn),
  thenifiedly.call(fn, 'ABC'),
  thenifiedly.call(fn, 1, 2, 3)
];

const obj = { f: jest.fn() };
const makeMethodCalls = () => [
  thenifiedly.callMethod('f', obj),
  thenifiedly.callMethod('f', obj, 'ABC'),
  thenifiedly.callMethod('f', obj, 1, 2, 3)
];

const thenifiedCallMethodF = thenifiedly.callMethodFactory('f');
const makeFactoryCalls = () => [
  thenifiedCallMethodF(obj),
  thenifiedCallMethodF(obj, 'ABC'),
  thenifiedCallMethodF(obj, 1, 2, 3)
];

beforeEach(() => {
  fn.mockReset();
  obj.f.mockReset();
});

describe.each([
  ['call', makeFunctionCalls, fn],
  ['callMethod', makeMethodCalls, obj.f],
  ['callMethodFactory(method)', makeFactoryCalls, obj.f]
])('%s()', (tested, makeCalls, mockFn) => {
  it('return a Promise', () => {
    const promises = makeCalls();
    promises.forEach(promise => {
      expect(promise instanceof Promise).toBe(true);
    });
  });

  it(`call function with ${
    tested === 'call' ? 'null' : 'object passed'
  } as this`, () => {
    makeCalls();

    expect(mockFn).toHaveBeenCalledTimes(3);
    mockFn.mock.instances.forEach(instance => {
      expect(instance).toBe(tested === 'call' ? null : obj);
    });
  });

  it('call function with last argument as callback function', () => {
    makeCalls();

    expect(mockFn).toHaveBeenCalledTimes(3);
    mockFn.mock.calls.forEach(args => {
      const callback = args[args.length - 1];
      expect(typeof callback).toBe('function');
      expect(callback.length).toBe(2);
    });
  });

  it('call function with args given', () => {
    makeCalls();

    expect(mockFn.mock.calls[0].length).toBe(1);

    expect(mockFn.mock.calls[1].length).toBe(2);
    expect(mockFn.mock.calls[1][0]).toBe('ABC');

    expect(mockFn.mock.calls[2].length).toBe(4);
    expect(mockFn.mock.calls[2].slice(0, 3)).toEqual([1, 2, 3]);
  });

  it('resolve result if callback return with no error', async () => {
    const result = { i: 'am result' };
    mockFn.mockImplementation((...args) => {
      args[args.length - 1](null, result);
    });

    const promises = makeCalls();

    await promises.map(promise => expect(promise).resolves.toBe(result));
  });

  it('reject reason if callback return with error', async () => {
    const result = { i: 'am result' };
    const error = { i: 'am error' };
    mockFn.mockImplementation((...args) => {
      args[args.length - 1](error, result);
    });

    const promises = makeCalls();

    await promises.map(promise => expect(promise).rejects.toBe(error));
  });
});
