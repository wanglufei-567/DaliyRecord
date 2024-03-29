// async function read() {
//   const a = await 1;
//   const b = await 2;
//   const c = await 3;
// }

'use strict';

function asyncGeneratorStep(
  gen,
  resolve,
  reject,
  _next,
  _throw,
  key,
  arg
) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(
          gen,
          resolve,
          reject,
          _next,
          _throw,
          'next',
          value
        );
      }
      function _throw(err) {
        asyncGeneratorStep(
          gen,
          resolve,
          reject,
          _next,
          _throw,
          'throw',
          err
        );
      }
      _next(undefined);
    });
  };
}

function read() {
  return _read.apply(this, arguments);
}

function _read() {
  _read = _asyncToGenerator(
    /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
      var a, b, c;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.next = 2;
              return 1;

            case 2:
              a = _context.sent;
              _context.next = 5;
              return 2;

            case 5:
              b = _context.sent;
              _context.next = 8;
              return 3;

            case 8:
              c = _context.sent;

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee);
    })
  );
  return _read.apply(this, arguments);
}
