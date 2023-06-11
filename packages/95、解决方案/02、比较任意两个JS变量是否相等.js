/**
 * 对比两个任意类型的变量是否相等(暂不支持Function)
 * @param {*要对比的两个变量} ab
 */
export const equarComplex = (a, b) => {
  // 判断类型
  const typeA = getObjType(a);
  const typeB = getObjType(b);
  if (typeA !== typeB) {
    return false;
  } else if (typeA === 'Base') {
    console.log('base', a, b);
    return a === b;
  } else if (typeA === 'Array') {
    if (a.length !== b.length) {
      console.log('array', a, b);
      return false;
    } else {
      // 循环遍历数组的值进行比较
      for (let i = 0; i < a.length; i++) {
        if (!equarComplex(a[i], b[i])) {
          console.log('array', a[i], b[i]);
          return false;
        }
      }
      return true;
    }
  } else if (typeA === 'Object') {
    if (Object.keys(a).length !== Object.keys(b).length) {
      console.log('Object', a, b);
      return false;
    }
    for (var o in a) {
      if (!equarComplex(a[o], b[o])) {
        console.log('Object', a[o], b[o]);
        return false;
      }
    }
    return true;
  } else if (typeA === 'Undefined' || typeA === 'Null') {
    return true;
  } else {
    console.log('Type Error');
    return false;
  }
};

/**
 * 获取变量的类型
 * @param {*要获取类型的变量} obj
 */
export const getObjType = obj => {
  const type = Object.prototype.toString.call(obj);
  switch (type) {
    case '[object Array]':
      return 'Array';
      break;
    case '[object Object]':
      return 'Object';
      break;
    case '[object Function]':
      return 'Function';
      break;
    case '[object Undefined]':
      return 'Undefined';
      break;
    case '[object Null]':
      return 'Null';
      break;
    case '[object Number]':
    case '[object String]':
    case '[object Boolean]':
      return 'Base';
      break;
    default:
      return 'Error';
      break;
  }
};
