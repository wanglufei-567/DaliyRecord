import {
  setInitialProperties,
  diffProperties,
  updateProperties
} from './ReactDOMComponent';
import {
  preCacheFiberNode,
  updateFiberProps
} from './ReactDOMComponentTree';

export function shouldSetTextContent(type, props) {
  return (
    typeof props.children === 'string' ||
    typeof props.children === 'number'
  );
}

export function createTextInstance(content) {
  return document.createTextNode(content);
}

/**
 * 在原生组件初次挂载的时候，会通过此方法创建真实DOM
 * @param {*} type 类型 span
 * @param {*} props 属性
 * @param {*} internalInstanceHandle 它对应的fiber
 * @returns
 */
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  // 提前缓存fiber节点的实例到DOM节点上
  preCacheFiberNode(internalInstanceHandle, domElement);
  //把属性直接保存在domElement的属性上
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props);
}

export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}

/**
 * @param {*} parentInstance 父DOM节点
 * @param {*} child 子DOM节点
 * @param {*} beforeChild 插入到谁的前面，它也是一个DOM节点
 */
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}

/**
 * @description 比较新老属性，收集属性的差异
 * @param domElement 老的DOM节点
 * @param type 虚拟DOM类型
 * @param oldProps 老的属性
 * @param newProps 新的属性
 */
export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  updateFiberProps(domElement, newProps);
}