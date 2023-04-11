/**
 * @description 链式调用实现加减乘除
 * chain(1).add(2).sub(1).multi(2).div(2) 结果为2
 */

// 方案一
class utils {
  chain(a) {
    this.val = a;
    return this;
  }
  add(b) {
    this.val += b;
    return this;
  }
  sub(c) {
    this.val -= c;
    return this;
  }
  multi(d) {
    this.val *= d;
    return this;
  }
  div(e) {
    this.val /= e;
    return this;
  }
  value() {
    return this.val;
  }
}
let util = new utils();
// console.log(util.chain(1).add(2).sub(1).multi(2).div(2).value());

// 方案二
function chain(param) {
  return {
    val: param,
    toString() {
      return this.val;
    },
    valueOf() {
      return this.val;
    },
    add(b) {
      this.val += b;
      return this;
    },
    sub(c) {
      this.val -= c;
      return this;
    },
    multi(d) {
      this.val *= d;
      return this;
    },
    div(e) {
      this.val /= e;
      return this;
    }
  };
}
// console.log(+chain(1).add(2).sub(1).multi(2).div(2));

/**
 * @description 利用柯里化实现链式相加
 * 实现 `add(1)(2, 3)(4)() = 10` 的效果
 */
function currying(fn) {
  // 用来存储入参的数组
  var allArgs = [];

  // 柯里化后的函数，这里采用了闭包的原理
  return function next() {
    // 将函数的入参转为数组
    var args = Array.from(arguments);

    if (args.length > 0) {
      // 有入参说明不是要真正执行源函数，继续返回柯里化后的函数
      allArgs = allArgs.concat(args);
      return next;
    } else {
      // 无入参，说明是要真正执行源函数了
      return fn.apply(null, allArgs);
    }
  };
}

var add = currying(function () {
  var sum = 0;
  for (var i = 0; i < arguments.length; i++) {
    sum += arguments[i];
  }
  return sum;
});

/**
 * @description 利用柯里化实现链式相加
 * 实现 `add(1)(2, 3)(4)(5) = 15` 的效果
 */

function currying(fn) {
  var allArgs = [];

  function next() {
    // 将函数的入参转为数组
    var args = Array.from(arguments);
    allArgs = allArgs.concat(args);
    return next;
  }

  // 字符类型
  next.toString = function () {
    return fn.apply(null, allArgs);
  };

  // 数值类型
  next.valueOf = function () {
    return fn.apply(null, allArgs);
  };

  return next;
}

var add = currying(function () {
  var sum = 0;
  for (var i = 0; i < arguments.length; i++) {
    sum += arguments[i];
  }
  return sum;
});
