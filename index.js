'use strict';

const defaultOptions = {
  mutipleValues: false,
  beginningError: true,
  promiseModule: Promise
};

const makeCallback = (resolve, reject, options) =>
  options.mutipleValues
    ? (...cbArgs) => {
        let err;
        if (beginningError && (err = cbArgs[0])) {
          reject(err);
        } else {
          resolve(beginningError ? cbArgs.slice(1) : cbArgs);
        }
      }
    : options.beginningError
      ? (err, val) => {
          if (err) {
            reject(err);
          } else {
            resolve(val);
          }
        }
      : resolve => resolve;

const factory = factoryOptions => {
  const options = Object.assign({}, defaultOptions, factoryOptions);
  const P = options.promiseModule

  return applier => (...args) =>
    new P((resolve, reject) => {
      const callback = makeCallback(resolve, reject, options);
      applier(callback, args);
    });
};

const call = factory()((callback, [fn, ...args]) => {
  args.push(callback);
  fn.apply(undefined, args);
});

const callMethod = factory()((callback, [method, instance, ...args]) => {
  args.push(callback);
  instance[method].apply(instance, args);
});

const tillEvent = factory({ beginningError: false })(
  (callback, [emitter, event]) => {
    emitter.on(event, (...args) => {
      callback.apply(emitter, args);
      emitter.off(callback);
    });
  }
);

module.exports = {
  call,
  callMethod,
  tillEvent,
  factory
};
