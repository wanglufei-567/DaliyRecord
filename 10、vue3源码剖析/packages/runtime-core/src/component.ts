import { hasOwn, isFunction, isObject } from '@vue/shared';
import { reactive, proxyRefs } from '@vue/reactivity';
import { ShapeFlags } from './createVNode';

/**
 * 全局变量 当前的组件实例
 * 在setup中使用
 */
export let instance = null;

/**
 * 获取、设置当前组件实例的方法
 */
export const getCurrentInstance = () => instance;
export const setCurrentInstance = i => (instance = i);

/**
 * 创建组件实例的方法
 * @param vnode 组件VNode, vnode.type是用户写的原始组件（是个对象）
 */
export function createComponentInstance(vnode, parent) {
  let instance = {
    data: null, // 组件本身的数据
    vnode, // 标识实例对应的虚拟节点
    subTree: null, // 组件对应的渲染的虚拟节点（组件render生成的vnode）
    isMounted: false, // 组件是否挂载过
    update: null, // 组件的effect.run方法
    render: null,
    propsOptions: vnode.type.props || {}, // 用户编写的原始组件中的props
    props: {}, // 这个props 代表用户接收的属性
    attrs: {}, // 用户没有接收的props放在这里
    proxy: null, // 代理对象
    setupState: {}, // setup返回的是对象则要给这个对象赋值
    parent, // 标记当前组件的父亲是谁
    provides: parent
      ? parent.provides
      : Object.create(null) // 组件的provides默认值是父组件的provides
  };
  return instance;
}

/**
 * 组件实例代理配置
 */
const instanceProxy = {
  get(target, key) {
    const { data, props, setupState } = target;
    // 用户访问组件上的data、props、$attrs等属性

    if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    } else if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    let getter = publicProperties[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    } else if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // 拦截用户修改组件实例props，要遵循单向数据流原则
      console.warn('props not update');
      return false;
    }
    return true;
  }
};

/**
 * 可以供用户访问的属性
 */
const publicProperties = {
  $attrs: instance => instance.attrs,
  $slots: instance => instance.slots
};

/**
 * 处理组件实例的props
 * @param instance 组件实例
 * @param rawProps 组件实际上接收到的所有props
 * 用户接收的放到instance.props上
 * 用户未接收的放到instance.attrs上
 */
function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};

  const options = instance.propsOptions;

  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key]; // 拿到对应的值

      // 这里应该校验值的类型 是否符合 要求的校验
      if (key in options) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  /**
   * 将组件实例的props进行代理，转换成ReactiveObj
   * 后续更新props可以直接重新渲染组件
   * Vue源码中用的是shallowReactive
   */
  instance.props = reactive(props);
  instance.attrs = attrs; // 默认是非响应式的
}

/**
 * 初始化slots
 * @param instance 组件实例
 * @param children 组件vnode上的children，也就是插槽对象
 */
function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 若children为slot类型，则将children挂到instance.slots上
    instance.slots = children;
  }
}

/**
 * 初次挂载组件时，处理组件的插槽和组件的属性的方法
 * (1) 给组件上的属性进行赋值
 * (2) 处理props属性，分开保存
 */
export function setupComponent(instance) {
  // type就是用户写的原始组件（是个对象）
  let { type, props, children } = instance.vnode;
  let { data, render, setup } = type;

  /**
   * 初始化props
   * 对props进行分开保存，并将组件的props置为响应式的
   */
  initProps(instance, props);

  /**
   * 初始化slots
   */
  initSlots(instance, children);

  /**
   * 创建组件代理对象，供用户使用
   * 避免用户直接操作组件实例
   * 同时对用户操作组件实例的行为进行提示
   */
  instance.proxy = new Proxy(instance, instanceProxy);

  /**
   * 处理组件data属性
   * 判断data是否时函数
   * 将data置为响应式
   */
  if (data) {
    if (!isFunction(data)) {
      return console.warn('The data option must be a function.');
    }
    /**
     * 将组件实例的data进行代理，转换成ReactiveObj
     * 后续更新props可以直接重新渲染组件
     */
    instance.data = reactive(data.call({}));
  }

  /**
   * 处理组件的setup属性
   * 执行setup，根据setup的执行结果改变组件的render或setupState
   * 给setup的两个参数props和context，在这里进行赋值并传参
   */
  if (setup) {
    // setup的context
    const context = {
      // 调用父组件方法的触发器
      emit: (eventName, ...args) => {
        /**
         * 对方法名字进行处理
         * childUpdate（子组件中触发的事件名） => onChildUpdate（父组件中的事件名）
         */
        const name = `on${eventName[0].toUpperCase()}${eventName.slice(
          1
        )}`;

        // 用户绑定的属性 包括事件
        let invoker = instance.vnode.props[name];
        // 调用组件绑定的事件，即可
        invoker && invoker(...args);
      },
      slots: instance.slots, //插槽属性
      attrs: instance.attrs, // attrs
      expose: exposed => {
        instance.exposed = exposed || {};
      }
    };

    /**
     * 执行setup
     * 并在执行setup之前将当前组件实例挂到全局变量instance上
     * 在setup中便可以通过getCurrentInstance拿到当前组件实例
     * 在setup执行完之后将全局变量instance重新置为null
     */
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, context);
    setCurrentInstance(null);

    if (isFunction(setupResult)) {
      // 若setup返回值是函数，则将该返回值置为组件的render
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      /**
       * 若setup返回值是对象，则将该对象挂在组件实例上
       * 并对该对象进行代理，若是ref则自动.value取值
       */
      instance.setupState = proxyRefs(setupResult);
    }
  }

  if (!instance.render) {
    // 若是setup中没有挂载render，则在这里挂载render
    if (render) {
      // 将用户写的render挂在组件实例上
      instance.render = render;
    } else {
      // 模板编译生成的render在这里挂到组件实例上
    }
  }
}
