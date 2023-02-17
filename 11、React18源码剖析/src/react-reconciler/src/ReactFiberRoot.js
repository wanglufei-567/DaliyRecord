import { createHostRootFiber } from './ReactFiber';
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue';

/**
 * @description FiberRootNode的构造函数，用于创建fiber根节点
 * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
 */
function FiberRootNode(containerInfo) {
  /*
  就是在这里给FiberRootNode上挂上了containerInfo，
  fiber根节点上的containerInfo直接就是真实DOM，div#root
  */
  this.containerInfo = containerInfo;
}

/**
 * @description 创建FiberRoot对象的方法
 * 调用createHostRootFiber()创建了根fiber对象 HostRootFiber
 * 调用new FiberRootNode()创建了fiber根节点 FiberRootNode
 * 将FiberRootNode和根HostRootFiber关联起来
 * 初始化HostRootFiber的 memoizedState 和 updateQueue
 * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
 */
export function createFiberRoot(containerInfo) {
  // 创建fiber根节点
  const root = new FiberRootNode(containerInfo);

  /*
    创建根fiber对象
    uninitializedFiber这个变量名很有意思，未初始化的fiber
   */
  const uninitializedFiber = createHostRootFiber();

  // fiber根节点的 current 指向根fiber对象
  root.current = uninitializedFiber;

  /*
    根fiber对象的 stateNode 指向fiber根节点，
    fiber根节点上的containerInfo直接就是真实DOM，div#root
   */
  uninitializedFiber.stateNode = root;

  // 初始化更新队列
  initialUpdateQueue(uninitializedFiber);

  return root;
}
