var __webpack_modules__ = {
  './src/title.js': module => {
    module.exports = {
      name: 'title_name',
      age: 'title_age'
    };
  }
};

var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
  var cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (__webpack_module_cache__[moduleId] = {
    exports: {}
  });
  __webpack_modules__[moduleId](
    module,
    module.exports,
    __webpack_require__
  );
  return module.exports;
}

/**
 * @description 返回一个获取默认导出的函数
 * 这里判断了module对象上是否有__esModule属性
 * 若有则说明引入的是ESModule模块，那么便返回module['default']作为default值
 * 若没有则说明引入的是CommonJS模块，那么便返回module本身作为default值
 */
__webpack_require__.n = module => {
  var getter =
    module && module.__esModule
      ? () => module['default']
      : () => module;
  __webpack_require__.d(getter, {
    a: getter
  });
  return getter;
};

__webpack_require__.d = (exports, definition) => {
  for (var key in definition) {
    if (
      __webpack_require__.o(definition, key) &&
      !__webpack_require__.o(exports, key)
    ) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key]
      });
    }
  }
};

__webpack_require__.o = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

__webpack_require__.r = exports => {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, {
      value: 'Module'
    });
  }
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
};

var __webpack_exports__ = {};

__webpack_require__.r(__webpack_exports__);

var _title__WEBPACK_IMPORTED_MODULE_0__ =
  __webpack_require__('./src/title.js');

/**
 * 默认导出default是个函数
 * 为什么是个函数？是为了兼容引入的模块同时有commonJS模块和ESModule模块的情况
 * 若是commonJS模块则直接返回module
 * 若是ESModule模块则返回module['default']
 */
var _title__WEBPACK_IMPORTED_MODULE_0___default =
  __webpack_require__.n(_title__WEBPACK_IMPORTED_MODULE_0__);

console.log(_title__WEBPACK_IMPORTED_MODULE_0___default());
console.log(_title__WEBPACK_IMPORTED_MODULE_0__.age);
