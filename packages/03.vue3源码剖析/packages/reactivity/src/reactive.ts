import { isObject } from '@vue/shared';
import { ReactiveFlags, mutableHandlers } from './baseHandler';

// 缓存列表，使用要代理的对象作key
const reactiveMap = new WeakMap();

function createReactiveObject(target: object, isReadonly: boolean) {
  // 只接受对象做代理
  if (!isObject(target)) {
    return target;
  }

  /**
   * 在进行对象代理前先进行取值，看是否已经是代理对象了
   * 若是已经代理过的对象，则target[ReactiveFlags.IS_REACTIVE]
   * 会走到getter方法，也就是mutableHandlers.get()中，
   * mutableHandlers.get()的返回值为true
   * 即target[ReactiveFlags.IS_REACTIVE]===true表示target已经被代理过了
   *
   * 若不是代理对象则target[ReactiveFlags.IS_REACTIVE]为undefined
   */
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 如果已经代理过则直接返回代理后的对象
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  // 对target进行代理
  const proxy = new Proxy(target, mutableHandlers);
  // 缓存已经代理的对象
  reactiveMap.set(target, proxy);

  return proxy;
}

// 常用的就是reactive方法
export function reactive(target: object) {
  return createReactiveObject(target, false);
}
