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
//没有时间戳
export const NoTimestamp = -1;

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

/**
 * 取是左侧的1的索引
 */
function pickArbitraryLaneIndex(lanes) {
  //clz32返回最左侧的1的左边0的个数
  //  000100010
  return 31 - Math.clz32(lanes);
}

/**
 * @description 计算车道的过期时间
 */
function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case SyncLane:
    case InputContinuousLane:
      return currentTime + 250;
    case DefaultLane:
      return currentTime + 5000;
    case IdleLane:
      return NoTimestamp;
    default:
      return NoTimestamp;
  }
}

/**
 * @description 标记所有饥饿赛道为过期
 * root上有个属性expirationTimes用于记录31条lane的过期时间（默认值为-1）
 * 当root.pendingLanes不为NoLanes时
 * 第一次会为pendingLanes的每条lane计算过期时间expirationTime
 * 后面会比较expirationTime和currentTime
 * 若expirationTime<currentTime，说明对应的lane已经过期
 * 过期的lane会被记录到root.expiredLanes
 */
export function markStarvedLanesAsExpired(root, currentTime) {
  //获取当前所有更新赛道
  const pendingLanes = root.pendingLanes;
  //获取root上记录所有赛道过期时间的属性
  const expirationTimes = root.expirationTimes;

  let lanes = pendingLanes;
  while (lanes > 0) {
    //获取最左侧的1的索引
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    const expirationTime = expirationTimes[index];

    //如果此赛道上没有过期时间,说明没有为此车道设置过期时间
    if (expirationTime === NoTimestamp) {
      expirationTimes[index] = computeExpirationTime(
        lane,
        currentTime
      );
    } else if (expirationTime <= currentTime) {
      //如果此车道的过期时间已经小于等于当前时间了，把此车道添加到过期车道里
      root.expiredLanes |= lane;
      console.log(
        'expirationTime',
        expirationTime,
        'currentTime',
        currentTime,
        root.expiredLanes
      );
    }
    lanes &= ~lane;
  }
}


/**
 * @description 创建一个用于记录所有车道过期时间的Map
 */
export function createLaneMap(initial) {
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}

/**
 * @description 判断当前lane是否过期
 */
export function includesExpiredLane(root, lanes) {
  return (lanes & root.expiredLanes) !== NoLanes;
}

/**
 * @description 将除了被保留的lane之外的所有lane标记为已完成
 * 重置root.pendingLanes为被保留的车道remainingLanes
 * 将root.expirationTimes上已完成的lane的过期时间重置为NoTimestamp
 */
export function markRootFinished(root, remainingLanes) {
  //pendingLanes根上所有的将要被渲染的车道 1和2
  //remainingLanes 被保留的车道 2
  //noLongerPendingLanes指的是已经更新过的lane
  const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes;
  const expirationTimes = root.expirationTimes;
  let lanes = noLongerPendingLanes;
  while (lanes > 0) {
    //获取最左侧的1的索引
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    //清除已经计算过的车道的过期时间
    expirationTimes[index] = NoTimestamp;
    lanes &= ~lane;
  }
}
