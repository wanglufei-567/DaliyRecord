/*
柯里化（Currying）把接受多个参数的函数转换成接受一个单一参数的函数，
例如将f(a,b,b)转换成f(a)(b)(c)
不过到目前为止我还没体会到这种转换的好处，后面有更加深入的理解后再回来补充
*/

/* ------------------------------------------------------------------- */

/* 一道面试题 实现一个sum()函数，可以计算sum(1)(2)(3)(4)(5)...(n) */
function add1(a, b) {
  return a + b;
}

/* 方式1 */
function curry1(fn, n) {
  let count = 0;
  let argArr = [];
  return function curryFn(arg) {
    argArr.push(arg);
    if (++count === n) {
      return argArr.reduce((total, current) => {
        return fn(total, current);
      });
    } else {
      return curryFn;
    }
  };
}

const sum1 = curry1(add1, 3);
const result1 = sum1(1)(2)(3);
console.log('result1', result1);

/* 方式2 */
function curry2(fn) {
  let argArr = [];
  return function curryFn(arg) {
    if (arguments.length === 0) {
      return argArr.reduce((total, current) => {
        return fn(total, current);
      });
    } else {
      argArr.push(arg);
      return curryFn;
    }
  };
}

const sum2 = curry2(add1);
const result2 = sum2(1)(2)(3)(4)();
console.log('result2', result2);

/* 这个问题貌似也不是用柯里化解决的，因为将f(a,b,b)转换成f(a)(b)(c)的前提条件得是知道f()的形参个数 */

/* ------------------------------------------------------------------- */

/* 柯里化的通用实现方式 */
var curry = function (fn) {
  // 获取fn的形参个数
  var len = fn.length;

  return function curryFn() {
    var innerLength = arguments.length,
      args = [...arguments];

    if (innerLength >= len) {
      // 递归出口，参数数组个数等于形参个数
      return fn(args);
    } else {
      return function () {
        var innerArgs = [...arguments],
        allArgs = args.concat(innerArgs);

        return curryFn(allArgs);
      };
    }
  };
};

// 测试一下
function add(num1, num2) {
  return num1 + num2;
}

var curriedAdd = curry(add);
curriedAdd(2)(3); //5

// 一个参数
function identity(value) {
  return value;
}

var curriedIdentify = curry(identify);
curriedIdentify(4); // 4
