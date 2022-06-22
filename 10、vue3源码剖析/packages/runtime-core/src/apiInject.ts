import { instance } from './component';

/**
 * provide方法
 * @param key 往组件实例上instance.provides挂的数据属性名
 * @param value 数据值
 * provide方法必须在组件的setup中使用
 */
export function provide(key, value) {

  /**
   * 如果没有实例则直接返回，
   * 说明这个方法没有在setup中使用
   */
  if (!instance) return;

  // 获取父组件的provides
  let parentProvides = instance.parent && instance.parent.provides;
  // 获取组件自己的provides
  let currentProvides = instance.provides;

  /**
   * 因为在初次挂载时，组件自身的provides是用父组件的provides作为默认值
   * 所以若组件自己的provides与父组件的provides相等时，则说明子组件没有自己的provides
   * 这样当组件内自己使用provide API时，便会出现覆盖父组件provides的风险
   * 因此需要创建一个属于自己的provides
   * 并且需要使用父组件的provides，作为自己provides对原型对象
   * 从而保证自己的子组件可以拿到自己父组件的provides
   * 这里使用到了原型链的原理
   * 父provides  儿子provides  孙子 provides
   * 曾孙 provides = {父provides,儿子provides，孙子provides } inject
   */
  if (currentProvides === parentProvides) {
    currentProvides = instance.provides =
      Object.create(parentProvides);
  }
  currentProvides[key] = value;
}

/**
 * inject方法
 * @param key 要使用的属性名
 * @param defaultValue 默认值
 */
export function inject(key, defaultValue) {
  // 如果没有实例则直接返回，说明这个方法没有在setup中使用
  if (!instance) return;

  /**
   * 父组件的provides
   * 当前组件首先从父组件的provides取数据
   * 父组件的provides中若没有，便会从父组件的父组件中取
   * 原型链的原理
   * 若父组件中的provides的数据是响应式的
   * 通过原型链取，不会丢失响应式
   * 所以可以在父组件中修改响应式数据，引起子组件的响应式变化
   */
  const provides = instance.parent?.provides;
  if (provides && key in provides) {
    return provides[key];
  } else {
    return defaultValue;
  }
}

