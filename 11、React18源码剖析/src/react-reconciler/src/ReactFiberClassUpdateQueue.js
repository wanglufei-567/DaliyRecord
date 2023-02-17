import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';

export const UpdateState = 0;

/**
 * @description 初始化更新队列的方法
 * @param fiber 一个fiber对象
 */
export function initialUpdateQueue(fiber) {
  // 创建一个更新队列对象
  const queue = {
    shared: {
      pending: null
    }
  };
  // 给fiber对象上添加属性updateQueue指向更新队列
  fiber.updateQueue = queue;
}

/**
 * @description 创建更新的方法
 * @returns 返回值是一个对象
 */
export function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

/**
 * @description 将更新对象添加到更新队列中的方法
 * @param fiber 初始的fiber对象
 * @param update 更新对象
 */
export function enqueueUpdate(fiber, update) {
  // 获取初始fiber对象上pending属性
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;

  if (pending === null) {
    // 若pending为null，则说明队列中还没有更新对象，则将更新对象的next指向自己
    update.next = update;
  } else {
    /**
     * 若pending不为null，则说明队列中已经有更新对象了
     * 则将该更新对象插入到队列中
     * 该更新对象的next指向原来pending的next
     * 原来pending的next指向该更新对象
     */
    update.next = pending.next;
    pending.next = update;
  }

  // pending 永远指向最后面的更新对象，最后面的更新对象的next永远指向第一个更新对象
  updateQueue.shared.pending = update;

  // 通过当前fiber找到根节点FiberRootNode并返回
  return markUpdateLaneFromFiberToRoot(fiber);
}

/**
 * @description 根据老状态和更新队列中的更新计算最新的状态
 * @param workInProgress 新fiber 要计算的fiber
 */
export function processUpdateQueue(workInProgress) {
  // 拿到更新队列
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;

  //如果有更新，或者说更新队列里有内容
  if (pendingQueue !== null) {
    //清除等待生效的更新
    queue.shared.pending = null;

    //获取更新队列中最后一个更新 update ={payload:{element:'h1'}}
    const lastPendingUpdate = pendingQueue;
    //指向第一个更新
    const firstPendingUpdate = lastPendingUpdate.next;
    //把更新链表剪开，变成一个单链表
    lastPendingUpdate.next = null;

    //获取老状态 初次渲染时为null
    let newState = workInProgress.memoizedState;
    // 将更新队列中的第一个更新赋值给update
    let update = firstPendingUpdate;

    // 这里循环遍历更新队列，直到所有更新对象都处理完成
    while (update) {
      //根据老状态和更新计算新状态
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }

    //将最终计算完成的更新状态赋值给memoizedState
    workInProgress.memoizedState = newState;
  }
}


/**
 * state=0 update=>1 update=2
 * @description 根据老状态和更新计算新状态，其实就是合并更新对象
 * @param update 新的更新对象 更新的对象其实有很多种类型
 * @param prevState 旧的更新对象
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      return assign({}, prevState, payload);
  }
}
