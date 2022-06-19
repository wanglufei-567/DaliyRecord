import { isArray, isObject } from '@vue/shared';
import { isVnode, createVNode } from './createVNode';

/**
 * h方法是createVNode的重载方法
 * 处理不同的入参情况时如何调用createVNode`
 * createVNode入参可能的情况
 * 1) 元素 内容
 * 2) 元素 属性 内容
 * 3) 元素 属性 多个儿子
 * 4) 元素 儿子 / 元素 (只要不是文本节点，都会把儿子转成数组)
 * 5) 元素 空属性 多个儿子
 * 注意子节点是：数组、文本、null
 */
export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    // 参数为两个的情况 1） 元素 + 属性 2） 元素 + children
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 若propsOrChildren是对象的话 则其可能是属性也有可能是children VNode
      if (isVnode(propsOrChildren)) {
        // children VNode 将其用数组包起来 h(type,元素对象)
        return createVNode(type, null, [propsOrChildren]);
      }
      // 属性 h(type,属性)
      return createVNode(type, propsOrChildren);
    } else {
      // 若propsOrChildren不是对象的话，那其一定是children VNode
      // children VNode是 数组 或者 字符 h(type,[] ) h(type,'文本‘)
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    // 参数大于两个的情况,则一定是 元素 + 属性 + children
    if (l === 3 && isVnode(children)) {
      // 只有三个参数 h(type,属性，children) 将children用数组包起来
      children = [children];
    } else if (l > 3) {
      // 大于三个参数 h(type,属性，children1，children2，...) 将children处理成数组
      children = Array.from(arguments).slice(2);
    }
    return createVNode(type, propsOrChildren, children);
  }
}
