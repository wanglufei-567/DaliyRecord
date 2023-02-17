const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

/**
 * @description 从真实的DOM节点上获取它对应的fiber节点
 * @param {*} targetNode 真实的DOM节点
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey]
  if (targetInst) {
    return targetInst;
  }
  return null;
  //如果真实DOM上没有fiber,就不要返回undefined,而是要返回null
}

/**
 * @description 提前缓存fiber节点的实例到DOM节点上
 * @param {*} hostInst fiber实例
 * @param {*} node 真实DOM
 */
export function preCacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}


/**
 * @description 在DOM节点保存props
 * @param node DOM节点
 * @param props 虚拟DOM上的props
 */
export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

/**
 * @description 从DOM节点获取props
 * @param node DOM节点
 */
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}