var __webpack_modules__ = {
  /**
   * @description
   * 和commonJS模块一样，ESModule模块被封装成了函数
   * 和commonJS模块不同的是，ESModule模块中通过__webpack_require__.d方法
   * 给module.exports对象上定义了属性的getter访问器
   * 所以使用ESModule模块中的属性是通过getter访问器进行取值的
   */
  './src/title.js': (
    __unused_webpack_module,
    __webpack_exports__,
    __webpack_require__
  ) => {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      age: () => age,
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    const __WEBPACK_DEFAULT_EXPORT__ = (name = 'title_name');
    const age = 'title_age';
  }
};

var __webpack_module_cache__ = {};

/**
 * @description require方法
 */
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
 * @description 给模块的导出对象定义属性,
 * 并给属性定义一个getter
 */
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

/**
 * @description 校验对象上是否有指定属性
 */
__webpack_require__.o = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

/**
 * @description r方法是用来给exports对象上添加两个自定义属性
 * 一般用来标识这个模块在编译前时ESModule
 */
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

/**
 * 创建一个变量用于存储模块导出的值
 * 后面再使用模块导出的值时，都是从该变量上取值
 */
var _title__WEBPACK_IMPORTED_MODULE_0__ =
  __webpack_require__('./src/title.js');
console.log(_title__WEBPACK_IMPORTED_MODULE_0__['default']);
console.log(_title__WEBPACK_IMPORTED_MODULE_0__.age);
