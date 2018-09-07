'use strict';

function thenifiedApplier(thisArg, fn, args) {
  return function promiseHanlder(resolve, reject) {
    args.push(function callback(err, value) {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
    fn.apply(thisArg, args);
  };
}

module.exports = {
  call(func, ...args) {
    return new Promise(thenifiedApplier(null, func, args));
  },

  callMethod(methodName, self, ...args) {
    return new Promise(thenifiedApplier(self, self[methodName], args));
  },

  callMethodFactory(methodName) {
    const functionName =
      'thenifiedlyCall' + methodName[0].toUpperCase() + methodName.slice(1);
    return {
      [functionName]: function(self, ...args) {
        return new Promise(thenifiedApplier(self, self[methodName], args));
      }
    }[functionName];
  }
};
