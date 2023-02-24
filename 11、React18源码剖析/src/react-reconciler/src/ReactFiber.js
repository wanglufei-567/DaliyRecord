import { HostComponent, HostRoot, IndeterminateComponent, HostText } from "./ReactWorkTags";
import { NoFlags } from './ReactFiberFlags';

/**
 * @description 创建fiber节点的方法， 每个虚拟DOM=>Fiber节点=>真实DOM
 * @param tag fiber的类型 函数组件0 类组件1 原生组件5 根元素3
 * @param pendingProps 新属性，等待处理或者说生效的属性
 * @param key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.type = null; //fiber对应的虚拟DOM节点的type，span div p
  this.stateNode = null; //此fiber对应的真实DOM节点

  this.return = null; //指向父节点
  this.child = null; //指向第一个子节点
  this.sibling = null; //指向弟弟

  /*
  fiber是通过虚拟DOM节点创建的
  虚拟DOM会提供pendingProps用来创建fiber节点的属性
   */
  this.pendingProps = pendingProps; //等待生效的属性，
  this.memoizedProps = null; //已经生效的属性

  /*
  每个fiber还会有自己的状态，每一种fiber的状态存的类型是不一样的
  类组件对应的fiber存的就是类的实例的状态,
  函数组件存的就是Hooks
  HostRoot存的就是要渲染的元素
   */
  this.memoizedState = null;

  //每个fiber身上可能还有更新队列
  this.updateQueue = null;

  /*
  副作用的标识，表示要针对此fiber节点进行何种操作
  */
  this.flags = NoFlags; //自己的副作用
  this.subtreeFlags = NoFlags; //子节点对应的副使用标识

  //替身，轮替 在后面讲DOM-DIFF的时候会用到
  this.alternate = null;

  // 索引 表明当前fiber在兄弟fiber间的位置
  this.index = 0;

  this.deletions = null;
}

/**
 * @description 创建fiber对象
 */
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

/**
 * @description 创建根fiber对象
 */
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * @description 基于老的fiber和新的属性创建新的fiber
 * @param current 老fiber
 * @param pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key
    );
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

/**
 * 根据虚拟DOM创建Fiber节点
 * @param element 虚拟DOM
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  // 这里将VDom的props属性赋值给了对应fiber的pendingProps，表示等待处理或者生效的属性
  return createFiberFromTypeAndProps(type, key, pendingProps);
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  // 默认tag是未定类型
  let tag = IndeterminateComponent;

  //如果类型type是一字符串 span div ，说此此Fiber类型是一个原生组件
  if (typeof type === 'string') {
    tag = HostComponent;
  }

  // 创建fiber
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}
