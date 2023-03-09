import { enqueueConcurrentClassUpdate } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';
import {
  NoLanes,
  mergeLanes,
  isSubsetOfLanes
} from './ReactFiberLane';

export const UpdateState = 0;

/**
 * @description 初始化更新队列的方法
 * @param fiber 一个fiber对象
 */
export function initialUpdateQueue(fiber) {
  // 创建一个更新队列对象
  const queue = {
    baseState: fiber.memoizedState, //本次更新前当前的fiber的状态,更新会其于它进行计算状态
    firstBaseUpdate: null, //本次更新前该fiber上保存的上次跳过的更新链表头
    lastBaseUpdate: null, //本次更新前该fiber上保存的上次跳过的更新链尾部
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
export function createUpdate(lane) {
  const update = { tag: UpdateState, lane, next: null };
  return update;
}

/**
 * @description 将更新对象添加到更新队列中的方法
 * @param fiber 初始的fiber对象
 * @param update 更新对象
 */
export function enqueueUpdate(fiber, update, lane) {
  // 获取初始fiber对象上pending属性
  const updateQueue = fiber.updateQueue;
  // 获取共享队列
  const sharedQueue = updateQueue.shared;
  // 返回根 root
  return enqueueConcurrentClassUpdate(
    fiber,
    sharedQueue,
    update,
    lane
  );
}

/**
 * @description 根据老状态和更新队列中的更新计算最新的状态
 * @param workInProgress 新fiber 要计算的fiber
 */
export function processUpdateQueue(
  workInProgress,
  props,
  workInProgressRootRenderLanes
) {
  // 获取新的更新队列
  const queue = workInProgress.updateQueue;
  // 第一个跳过的更新
  let firstBaseUpdate = queue.firstBaseUpdate;
  // 最后一个跳过的更新
  let lastBaseUpdate = queue.lastBaseUpdate;
  // 获取待生效的队列
  const pendingQueue = queue.shared.pending;

  /**  如果有新链表合并新旧链表开始  */
  // 如果有新的待生效的队列
  if (pendingQueue !== null) {
    // 先清空待生效的队列
    queue.shared.pending = null;
    // 最后一个待生效的更新
    const lastPendingUpdate = pendingQueue;
    // 第一个待生效的更新
    const firstPendingUpdate = lastPendingUpdate.next;
    // 把环状链表剪开
    lastPendingUpdate.next = null;
    // 如果没有老的更新队列
    if (lastBaseUpdate === null) {
      // 第一个基本更新就是待生效队列的第一个更新
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 否则把待生效更新队列添加到基本更新的尾部
      lastBaseUpdate.next = firstPendingUpdate;
    }
    // 最后一个基本更新肯定就是最后一个待生效的更新
    lastBaseUpdate = lastPendingUpdate;
  }
  /**  合并新旧链表结束  */

  //如果链表不为空firstBaseUpdate=>lastBaseUpdate
  if (firstBaseUpdate !== null) {
    //上次跳过的更新前的状态
    let newState = queue.baseState;
    //尚未执行的更新的lane
    let newLanes = NoLanes;
    // 新的基本状态
    let newBaseState = null;
    // 新的第一个基本更新
    let newFirstBaseUpdate = null;
    // 新的最后一个基本更新
    let newLastBaseUpdate = null;
    // 第一个更新
    let update = firstBaseUpdate;
    do {
      //获取此更新车道
      const updateLane = update.lane;
      //如果说updateLane不是renderLanes的子集的话，说明本次渲染不需要处理过个更新，就是需要跳过此更新
      if (
        !isSubsetOfLanes(workInProgressRootRenderLanes, updateLane)
      ) {
        // 复制此更新并添加新的基本链表中
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload
        };
        //说明新的跳过的base链表为空,说明当前这个更新是第一个跳过的更新
        if (newLastBaseUpdate === null) {
          //让新的跳过的链表头和链表尾都指向这个第一次跳过的更新
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          //计算保存新的baseState为此跳过更新时的state
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        //如果有跳过的更新，就把跳过的更新所在的赛道合并到newLanes,
        //最后会把newLanes赋给fiber.lanes
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        //说明已经有跳过的更新了
        if (newLastBaseUpdate !== null) {
          const clone = {
            id: update.id,
            lane: 0,
            payload: update.payload
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newState = getStateFromUpdate(update, newState);
      }
      update = update.next;
    } while (update);
    //如果没能跳过的更新的话
    if (!newLastBaseUpdate) {
      newBaseState = newState;
    }
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    //本次渲染完会判断，此fiber上还有没有不为0的lane,如果有，会再次渲染
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}

/**
 * state=0 update=>1 update=2
 * @description 根据老状态和更新计算新状态，其实就是合并更新对象
 * @param update 新的更新对象 更新的对象其实有很多种类型
 * @param prevState 旧的更新对象
 */
function getStateFromUpdate(update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      let partialState;
      if (typeof payload === 'function') {
        partialState = payload.call(null, prevState, nextProps);
      } else {
        partialState = payload;
      }
      return assign({}, prevState, partialState);
  }
}

/**
 * @description 复制更新队列
 */
export function cloneUpdateQueue(current, workInProgress) {
  const workInProgressQueue = workInProgress.updateQueue;
  const currentQueue = current.updateQueue;
  //如果新的队列和老的队列是同一个对象的话，则进行更新队列的复制
  if (currentQueue === workInProgressQueue) {
    const clone = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared
    };
    workInProgress.updateQueue = clone;
  }
}
