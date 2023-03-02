import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork
} from './ReactFiberLane';

//离散事件优先级 click onchange
export const DiscreteEventPriority = SyncLane; //1
//连续事件的优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane; //4
//默认事件车道
export const DefaultEventPriority = DefaultLane; //16
//空闲事件优先级
export const IdleEventPriority = IdleLane;

// 全局变量 当前更新的优先级 默认值是NoLane 没有车道
let currentUpdatePriority = NoLane;

/**
 * @description 获取当前更新优先级 默认值是NoLane 没有车道
 */
export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}

/**
 * @description 设置当前更新优先级
 */
export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}

/**
 * @description 把lane转成事件优先级
 * lane 31
 * 事件优先级是4
 * 调度优先级5
 * @param {*} lanes
 * @returns
 */
export function lanesToEventPriority(lanes) {
  //获取最高优先级的lane
  let lane = getHighestPriorityLane(lanes);

  // 判断eventPriority是不是比lane优先级更高
  // eventPriority优先级高于lane优先级的话，lane优先级不能转变为eventPriority优先级
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority; // 离散事件优先级 click onchange 1
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority; // 连续事件的优先级 mousemove 4
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority; // 默认事件车道 16
  }

  return IdleEventPriority; // 空闲事件优先级
}

/**
 * 判断eventPriority是不是比lane要小，更小意味着优先级更高
 * @param {*} eventPriority
 * @param {*} lane
 * @returns
 */
 export function isHigherEventPriority(eventPriority, lane) {
  return eventPriority !== 0 && eventPriority < lane;
}