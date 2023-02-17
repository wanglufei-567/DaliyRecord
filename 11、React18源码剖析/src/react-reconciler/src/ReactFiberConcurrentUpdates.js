import { HostRoot } from "./ReactWorkTags";

/**
 * 本来此文件要处理更新优先级的问题
 * 目前现在只实现向上找到根节点
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;//当前fiber
  let parent = sourceFiber.return;//当前fiber父fiber
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  //一直找到parent为null，parent为null则说明找到了HostRootFiber
  if (node.tag === HostRoot) {
    // 返回HostRootFiber.stateNode，也就是FiberRootNode
    return node.stateNode;
  }
  return null;
}