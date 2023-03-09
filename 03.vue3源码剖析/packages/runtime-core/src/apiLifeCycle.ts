import { instance, setCurrentInstance } from './component';

export const enum LifeCycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  UPDATED = 'u'
}

/**
 * 创建生命周期方法的方法
 * @param type 生命周期钩子函数的类型
 * @returns 返回值便是提供给用户使用的生命周期钩子
 * 当用户在setup中使用某个具体的钩子时
 * 会在当前组件实例上添加一个表示当前钩子的属性
 * 该属性的值是个数组，用于存储用户填写的钩子回调函数
 */
function createInvoker(type) {

  /**
   * @param hook 用户填写的钩子回调
   * @param currentInstance 就是当前调用 钩子 所在的组件的实例
   * 后续全局变量 instance 变化了不会影响 currentInstance
   */
  return function (hook, currentInstance = instance) {
    if (currentInstance) {
      // 给当前组件实例上挂上钩子属性
      const lifeCycles =
        currentInstance[type] || (currentInstance[type] = []);
      /**
       * 采用AOP思想
       * 包装用户填写的钩子回调
       * 保证钩子在执行时
       * 调用getCurrentInstance可以拿到当前组件实例
       */
      const wrapHook = () => {
        setCurrentInstance(currentInstance);
        // 指定用户的钩子回调的this指向当前组件实例
        hook.call(currentInstance);
        setCurrentInstance(null);
      };

      lifeCycles.push(wrapHook);
    }
  };
}

// lifecycle hook BEFORE_MOUNT
export const onBeforeMount = createInvoker(LifeCycle.BEFORE_MOUNT);
// lifecycle hook MOUNTED
export const onMounted = createInvoker(LifeCycle.MOUNTED);
// lifecycle hook UPDATED
export const onUpdated = createInvoker(LifeCycle.UPDATED);
