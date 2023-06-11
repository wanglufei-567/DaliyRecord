var __webpack_modules__ = {
  /**
   * @description
   * 和commonJS模块一样，ESModule模块被封装成了函数
   * 和commonJS模块不同的是，ESModule模块中通过__webpack_require__.d方法
   * 给module.exports对象上定义了属性的getter访问器
   * 所以使用ESModule模块中的属性是通过getter访问器进行取值的
   *
   * 基于这方面的不同，所以有这种说法：
   * commonJS导出的是值
   * ESModule导出的是引用
   */
  './src/title.js': (
    __unused_webpack_module,
    __webpack_exports__,
    __webpack_require__
  ) => {
    'use strict';
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      // 这里就是getter访问器
      age: () => age,
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    const __WEBPACK_DEFAULT_EXPORT__ = 'title_name';
    const age = 'title_age';
  }
};

/**
 * @description commonJS中引入的模块缓存
 */
var __webpack_module_cache__ = {};

/**
 * @description require方法的实现
 * commonJS中的require方法
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

__webpack_require__.o = (obj, prop) =>

/**
 * @description r方法是用来给exports对象上添加两个自定义属性
 * 一般用来标识这个模块在编译前时ESModule
 */
__webpack_require__.r = exports => {
  /**
   * 为什么要定义Symbol.toStringTag和_ESModule属性?
   * 不同来源的模块取值方法是不一样的
   * 给exports设置Symbol.toStringTag属性为Module后
   * Object.prototype.toString.call(exports))的结果为[object Module]
   */
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

/**
 * commonJS文件中的内容
 */
let title = __webpack_require__('./src/title.js');
console.log(title);
console.log(title.age);
