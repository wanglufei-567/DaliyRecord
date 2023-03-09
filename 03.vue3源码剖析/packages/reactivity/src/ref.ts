import { isObject } from '@vue/shared';
import { activeEffect, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';

/**
 * 用于将对象转换成ReactiveObj
 */
export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

/**
 * 对传入进来的基础类型数据、对象进行代理到value属性上
 * (用到的其实是defineProperty方法)
 * (es6 class中的get、set编译成es5的话就是defineProperty)
 * 并对value属性设置响应式逻辑
 * get时收集依赖 trackEffects
 * set时触发更新 triggerEffects
 */
class RefImpl {
  private _value;
  private dep;
  private __v_isRef = true;
  constructor(public rawValue, public _shallow) {
    // 浅ref不需要再次代理
    this._value = _shallow ? rawValue : toReactive(rawValue);
  }

  get value() {
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = new Set())); // 收集依赖
    }
    return this._value;
  }

  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal; // rawValue为原始数据，会保留在ref对象上
      this._value = this._shallow ? newVal : toReactive(newVal);
      triggerEffects(this.dep); // 触发更新
    }
  }
}

/**
 * 将原始数据进行装包，转变成响应式数据
 */
function createRef(rawValue, shallow) {
  return new RefImpl(rawValue, shallow);
}

/**
 * 将原始类型包装成对象, 同时也可以包装对象 进行深层代理
 */
export function ref(value) {
  return createRef(value, false);
}

/**
 * 创建浅ref 不会进行深层代理
 */
export function shallowRef(value) {
  return createRef(value, true);
}

/**
 * 对传入进来的ReactiveObj进行代理,将ReactiveObj[key]挂到value属性上
 * 这里不需要做响应式逻辑，因为ReactiveObj[key]本身就有响应式特性
 * 这里只是完成对ReactiveObj 的 attr的使用而已
 * 会走到ReactiveObj Proxy中的get和set
 */
class ObjectRefImpl {
  private __v_isRef = true;
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

/**
 * 遍历object，每个属性都生成一个ref
 */
export function toRefs(object) {
  let result = {};
  for (let key in object) {
    result[key] = toRef(object, key);
  }
  return result;
}

/**
 * 做一层代理，若是ref对象，则直接使用value属性
 */
export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, receiver) {
      if (target[key].__v_isRef) {
        target[key].value = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    }
  });
}
