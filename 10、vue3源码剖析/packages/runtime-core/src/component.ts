import { hasOwn, isFunction } from '@vue/shared';
import { reactive } from '@vue/reactivity';

/**
 * 创建组件实例的方法
 * @param vnode 组件VNode, vnode.type是用户写的原始组件（是个对象）
 */
export function createComponentInstance(vnode) {
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
    proxy: null // 代理对象
  };
  return instance;
}

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
 * 可以供用户访问的属性
 */
const publicProperties = {
  $attrs: instance => instance.attrs
};

/**
 * 组件实例代理配置
 */
const instanceProxy = {
  get(target, key) {
    const { data, props } = target;
    // 用户访问组件上的data、props、$attrs等属性
    if (data && hasOwn(data, key)) {
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
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
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
 * 初次挂载组件时，处理组件的插槽和组件的属性的方法
 * (1) 给组件上的属性进行赋值
 * (2) 处理props属性，分开保存
 */
export function setupComponent(instance) {
  // type就是用户写的原始组件（是个对象）
  let { type, props } = instance.vnode;
  let { data, render } = type;

  /**
   * 处理props
   */
  initProps(instance, props);

  /**
   * 创建组件代理对象，供用户使用
   * 避免用户直接操作组件实例
   * 同时对用户操作组件实例的行为进行提示
   */
  instance.proxy = new Proxy(instance, instanceProxy);

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

  // 将用户写的render挂在组件实例上
  instance.render = render;
}
