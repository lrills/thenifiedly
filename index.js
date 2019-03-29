'use strict';

const defaultOptions = {
  mutipleValues: false,
  beginningError: true,
  promiseClass: Promise
};

const handle = (applier, options) =>
  options.mutipleValues
    ? (args, resolve, reject) => {
        const { beginningError } = options;

        applier((...cbArgs) => {
          let err;

          if (beginningError && (err = cbArgs[0])) {
            reject(err);
          } else {
            resolve(beginningError ? cbArgs.slice(1) : cbArgs);
          }
        }, args);
      }
    : options.beginningError
    ? (args, resolve, reject) => {
        applier((err, val) => {
          if (err) {
            reject(err);
          } else {
            resolve(val);
          }
        }, args);
      }
    : (args, resolve) => {
        applier(resolve, args);
      };

const factory = (applier, factoryOptions) => {
  const options = Object.assign({}, defaultOptions, factoryOptions);
  const P = options.promiseClass;

  const handler = handle(applier, options);

  return (...args) => new P(handler.bind(null, args));
};

const call = factory((callback, [fn, ...args]) => {
  args.push(callback);
  fn.apply(undefined, args);
});

const callMethod = factory((callback, [method, instance, ...args]) => {
  args.push(callback);
  instance[method].apply(instance, args);
});

const tillEvent = factory(
  (callback, [event, emitter]) => {
    emitter.once(event, callback);
  },
  { beginningError: false }
);

module.exports = {
  call,
  callMethod,
  tillEvent,
  factory
};
