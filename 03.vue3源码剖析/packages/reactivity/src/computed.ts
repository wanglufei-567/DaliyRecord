import { isFunction } from '@vue/shared';
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects
} from './effect';

export function computed(getterOrOptions) {
  // 判断传进来的是get方法还是配置项
  let isGetter = isFunction(getterOrOptions);

  // 赋值get和set方法
  let getter;
  let setter;
  const fn = () => console.warn('computed is readonly ');
  if (isGetter) {
    getter = getterOrOptions;
    setter = fn;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set || fn;
  }

  // 返回ComputedRefImpl实例
  return new ComputedRefImpl(getter, setter);
}

/**
 * ComputedRefImpl类
 * 内部封装了ReactiveEffect的实例化
 * 负责依赖收集的工作
 */
class ComputedRefImpl {
  private _value; // 用来存储计算属性的结果
  private _dirty = true; // 用来判断是否缓存，即是否重新计算
  public effect; // 计算属性对应的effect
  public deps; // 用于收集依赖当前计算属性的effect(注意：和计算属性对应effect区分开)
  private __v_isRef = true; // 用于标识是否是ref
  constructor(getter, public setter) {

    /**
     * 实例化一个effect
     * 在getter中使用响应式数据attr时，此effect会被收集到targetMap上
     * 当响应式数据attr发生变化时，此effect便会被触发更新
     * 最终走到第二个参数scheduler中
     */
    this.effect = new ReactiveEffect(getter, () => {
      /**
       * 此effect的scheduler
       * 这里自定义 当前计算属性依赖的 attr 发生变化后的更新逻辑
       */
      if (!this._dirty) {
        /**
         * 这里的更新逻辑是
         * 当计算属性被使用后，_dirty就会为false，使用的便是缓存值了
         * 也只有计算属性被使用后，才需要走这段更新逻辑
         */
        this._dirty = true;
        // 通知依赖当前计算属性的effect更新
        triggerEffects(this.deps);
      }
    });
  }

  get value() {
    /**
     * 有effect依赖当前计算属性的话，就将其收集到 当前计算属性 的deps中
     *
     * 注意：只有当effect的副作用函数执行时，activeEffect才有值，
     * 若是当前计算属性value在被使用时，activeEffect有值的话
     * 就说明了此activeEffect是依赖当前计算属性的
     */
    if (activeEffect) {
      trackEffects(this.deps || (this.deps = new Set()));
    }

    /**
     * 只有当_dirty为true时
     * 即当前计算属性依赖的 attr 发生变化后
     * 才走计算属性的getter逻辑并更新_value
     * 否则就不更新_value直接返回（也就是缓存值）
     */
    if (this._dirty) {
      // 将_dirty置为false，表明接下来计算属性返回的是缓存值
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }

  /**
   * 直接执行用户配置的set
   * 在set中可以直接修改 reactiveObj 的 attr
   */
  set value(newValues) {
    this.setter(newValues);
  }
}
