import { ReactiveEffect } from './effect';
import { isReactive } from './baseHandler';
import { isFunction, isObject } from '@vue/shared';

/**
 * 用来递归访问对象属性
 * set用来存放已经迭代过的对象
 */
function traversal(value, set = new Set()) {
  if (!isObject(value)) {
    return value;
  }

  if (set.has(value)) {
    // 此对象已经被迭代过了
    return value;
  }
  set.add(value);

  for (let key in value) {
    // 递归逻辑，value[key] 访问所有属性
    traversal(value[key], set);
  }

  return value;
}

export function watch(source, cb, { immediate } = {} as any) {
  let get; // 用来存放要监控的对象，函数形式
  let oldValue; // 存放老值
  let cleanup; // 用于清理上一次watch操作的

  if (isReactive(source)) {
    /**
     * 若是传进来的是个ReactiveObj,
     * 则生成一个遍历访问的fn,供后续new ReactiveEffect(fn, scheduler)使用
     * 创建一个effect，让这个effect收集source中的所有属性
     */
    get = () => traversal(source);
  } else if (isFunction(source)) {
    // 若传进来的是一个函数则直接使用、
    get = source;
  }

  /**
   * onCleanup(fn),接收用户传入的方法作为参数，并赋值给cleanup
   */
  const onCleanup = fn => {
    cleanup = fn;
  };

  /**
   * scheduler方法，数据变化后调用
   */
  const job = () => {
    /**
     * 第一次执行时cleanup是undefined
     * 如果cleanup有值，则是上一次赋值的
     * 所以这里的cleanup是上一次的，利用了的闭包原理
     */
    cleanup && cleanup();

    // 数据变化后重新调用effect.run函数，会获得最新的值
    let newValue = effect.run();

    // 执行用户传进来的回调，并传入参数
    cb(newValue, oldValue, onCleanup);

    // 回调执行完之后，将这一次执行的新值赋值给oldValue
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(get, job);

  if (immediate) {
    // 需要立即执行，则立刻执行任务
    job();
  }

  // 默认调用run方法会执行get函数，此时source作为了第一次的老值（get的返回值是source）
  oldValue = effect.run();
}
