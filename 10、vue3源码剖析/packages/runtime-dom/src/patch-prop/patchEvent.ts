/**
 * 创建invoker
 * 在绑定事件的时候，绑定一个伪造的事件处理函数invoker
 * 把真正的事件处理函数设置为invoker.value属性的值
 * 这么做是为了提升性能
 * 只需要修改value的引用就可以调用不同的逻辑
 * 避免了绑定事件时新建函数的开销
 */
function createInvoker(initialValue) {
  const invoker = e => {
    invoker.value(e);
  };

  // 后续只需要修改value的引用就可以 达到调用不同的逻辑
  invoker.value = initialValue;
  return invoker;
}

/**
 * 操作元素的事件
 */
export function patchEvent(el, eventName, nextValue) {
  // 给元素el添加_vei属性用于存储事件
  const invokers = el._vei || (el._vei = {});
  const exitingInvoker = invokers[eventName];

  if (exitingInvoker && nextValue) {
    // 存在缓存的情况，直接进行换绑
    exitingInvoker.value = nextValue;
  } else {
    // 不存在缓存的情况 需要添加事件，事件名一般是这种形式的 onClick onMousedown
    const eName = eventName.slice(2).toLowerCase();
    if (nextValue) {
      // el._vei = {onClick: invoker}
      const invoker = createInvoker(nextValue);
      // 缓存invoker
      invokers[eventName] = invoker;
      el.addEventListener(eName, invoker);
    } else if (exitingInvoker) {
      // 没有新的值，但是之前绑定过 需要删除之前的
      el.removeEventListener(eName, exitingInvoker);
      // 清除缓存invoker
      invokers[eventName] = null;
    }
  }
}
