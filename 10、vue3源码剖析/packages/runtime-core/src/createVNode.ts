import { isArray, isString, isNumber, isObject } from '@vue/shared';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

/**
 * 判断是否是VNode
 */
export function isVnode(val) {
  return !!val.__v_isVNode;
}

/**
 * 判断是否是相同VNode
 */
export function isSameVNode(v1, v2) {
  return v1.type === v2.type && v1.key == v2.key;
}

/**
 * 格式化children
 * children有可能是字符串或数字，需要将其处理成VNode
 */
export function normalizeVNode(children, i) {
  if (isString(children[i]) || isNumber(children[i])) {
    children[i] = createVNode(Text, null, children[i]);
  }
  return children[i];
}

/**
 * vue3中的形状标识
 * 通过组合可以描述虚拟节点的类型
 */
export const enum ShapeFlags {
  ELEMENT = 1, // 1
  FUNCTIONAL_COMPONENT = 1 << 1, // 2
  STATEFUL_COMPONENT = 1 << 2, // 4
  TEXT_CHILDREN = 1 << 3, // 8
  ARRAY_CHILDREN = 1 << 4, // 16
  SLOTS_CHILDREN = 1 << 5, // 32
  TELEPORT = 1 << 6, // 64
  SUSPENSE = 1 << 7, // 128
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT |
    ShapeFlags.FUNCTIONAL_COMPONENT
}

/**
 * 创建VirtualNode
 */
export function createVNode(type, props = null, children = null) {
  /**
   * 标记创建的是什么类型的VNode
   * type: string 元素类型
   * type：Object 组件类型 (组件本身是个对象，包含render方法)
   */
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vnode = {
    __v_isVNode: true, // vnode标识
    type, // 真实节点的类型
    props,
    children,
    key: props && props.key,
    el: null,
    shapeFlag // 标记自己的类型及children VNode的类型
  };

  /**
   * 通过位运算
   * 将当前的VNode 和 children VNode映射起来
   * 通过shapeFlags 就可以知道children VNode的类型了 是数组 还是元素 还是文本、插槽
   * 利用的是位运算在权限控制中的应用
   */
  if (children !== undefined && children !== null) {
    let temp = 0;
    // 子节点的数据格式，暂时只考虑数组和字符串
    if (isArray(children)) {
      temp = ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      // children是对象的话，暂时直接判断为插槽（还有可能为其他类型）
      temp = ShapeFlags.SLOTS_CHILDREN;
    } else {
      children = String(children);
      temp = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag = vnode.shapeFlag | temp;
  }

  return vnode;
}
