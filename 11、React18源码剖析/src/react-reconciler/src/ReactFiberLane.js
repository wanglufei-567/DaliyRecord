import { allowConcurrentByDefault } from 'shared/ReactFeatureFlags';

export const TotalLanes = 31;
//没有车道，所有位都为0
export const NoLanes = 0b0000000000000000000000000000000;
export const NoLane = 0b0000000000000000000000000000000;
export const SyncLane = 0b0000000000000000000000000000001;
export const InputContinuousHydrationLane = 0b0000000000000000000000000000010;
export const InputContinuousLane = 0b0000000000000000000000000000100;
export const DefaultHydrationLane = 0b0000000000000000000000000001000;
//默认事件车道
export const DefaultLane = 0b0000000000000000000000000010000;
export const SelectiveHydrationLane = 0b0001000000000000000000000000000;
export const IdleHydrationLane = 0b0010000000000000000000000000000;
export const IdleLane = 0b0100000000000000000000000000000;
export const OffscreenLane = 0b1000000000000000000000000000000;
const NonIdleLanes = 0b0001111111111111111111111111111;

/**
 * @description 合并车道
 */
export function mergeLanes(a, b) {
  return a | b;
}

/**
 * @description 给当前根 root标记更新的车道
 */
export function markRootUpdated(root, updateLane) {
  //pendingLanes指的此根上等待生效的lane
  root.pendingLanes |= updateLane;
}

/**
 * @description 获取当前优先级最高的车道
 */
export function getNextLanes(root, wipLanes) {
  //先获取所有的有更新的车道
  const pendingLanes = root.pendingLanes;
  if (pendingLanes == NoLanes) {
    return NoLanes;
  }
  //获取所有的车道中最高优先级的车道
  const nextLanes = getHighestPriorityLanes(pendingLanes);

  if (wipLanes !== NoLane && wipLanes !== nextLanes) {
    // 新的车道值nextLanes比渲染中的车道wipLanes大，说明新的车道优先级更低
    // 则仍然返回渲染中的车道wipLanes
    if (nextLanes > wipLanes) {
      return wipLanes;
    }
  }
  return nextLanes;
}

/**
 * @description 获取当前优先级最高的车道
 */
export function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes);
}

//找到最右边的1 只能返回一个车道
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

/**
 * @description 判断当前车道是否包含NoLanes
 */
export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes;
}

/**
 * @description 判断当前车道是否包含阻塞型的Lanes
 */
export function includesBlockingLane(root, lanes) {
  //如果允许默认并行渲染
  if (allowConcurrentByDefault) {
    return false;
  }

  const SyncDefaultLanes = InputContinuousLane | DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLanes;
}

/**
 * @description 判断subset是不是set的子集
 */
export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}
