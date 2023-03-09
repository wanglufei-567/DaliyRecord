const UpdateState = 0;

/**
 * @description 初始化更新队列的方法
 * @param fiber 一个fiber对象
 */
function initializeUpdateQueue(fiber) {
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
function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

/**
 * @description 将更新对象添加到更新队列中的方法
 * @param fiber 初始的fiber对象
 * @param update 更新对象
 */
function enqueueUpdate(fiber, update) {
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
}


function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState: {
      const { payload } = update;
      const partialState = payload;
      return Object.assign({}, prevState, partialState);
    }
    default:
      return prevState;
  }
}

/**
 * @description 合并更新队列中的所有更新对象
 * @param workInProgress 包含更新队列的fiber对象
 */
function processUpdateQueue(workInProgress) {
  // 先获取到队列中的最后一个更新对象，也就是pending的指向
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;

  if (pendingQueue !== null) {
    // 将循环链表的链断掉，变成单向链表
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;

    let newState = workInProgress.memoizedState;
    let update = firstPendingUpdate;

    // 从第一个更新对象开始，不断地合并更新信息到初始fiber对象中去
    while (update) {
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    workInProgress.memoizedState = newState;
  }
}

let fiber = { memoizedState: { id: 1 } };

initializeUpdateQueue(fiber);

let update1 = createUpdate();
update1.payload = { name: 'zhufeng' };
enqueueUpdate(fiber, update1);

let update2 = createUpdate();
update2.payload = { age: 14 };
enqueueUpdate(fiber, update2);

processUpdateQueue(fiber);

console.log(fiber);
