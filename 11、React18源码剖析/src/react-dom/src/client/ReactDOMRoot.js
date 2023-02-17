import {
  createContainer,
  updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';
import { listenToAllSupportedEvents } from 'react-dom-bindings/src/events/DOMPluginEventSystem';

/**
 * @description ReactDOMRoot的构造函数
 * @param internalRoot 内部使用的root，是FiberRootNode的实例，
 * internalRoot 可以理解成是个中间量
 */
function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

/**
 * @description 给ReactDOMRoot构造函数添加render方法
 * @description 更新容器
 * @param children 要渲染的虚拟DOM
 */
ReactDOMRoot.prototype.render = function (children) {
  // 拿到ReactDOMRoot实例上的internalRoot,也就是FiberRootNode
  const root = this._internalRoot;

  // 更新容器，将虚拟DOM变成真实DOM插入到container容器中
  updateContainer(children, root);
};

/**
 * @description 创建root的方法
 * @description 调用createContainer()创建容器
 * @description 调用new ReactDOMRoot() 创建ReactDOMRoot对象
 * @param container 容器，真实的DOM节点，div#root
 * @returns 返回一个ReactDOMRoot对象，也就是所谓的root
 */
export function createRoot(container) {
  const root = createContainer(container);
  // 根节点上进行事件监听
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}
