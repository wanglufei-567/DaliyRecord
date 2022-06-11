import { isObject } from '@vue/shared';
import { reactive } from './reactive';
import { track, trigger } from './effect';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export function isReactive(value) {
  return value && value[ReactiveFlags.IS_REACTIVE];
}

export const mutableHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    // 在get中增加标识，当获取IS_REACTIVE时返回true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 让当前的属性和 正在激活的effect关联起来
    track(target, key);

    const res = Reflect.get(target, key, receiver);

    // 嵌套的对像在这里完成代理
    if (isObject(res)) {
      return reactive(res);
    }

    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    if (oldValue !== value) {
      // 重新赋值时，若新值和老值不同则触发effect
      let result = Reflect.set(target, key, value, receiver);
      trigger(target, key, value);
      return result;
    }
  }
};
