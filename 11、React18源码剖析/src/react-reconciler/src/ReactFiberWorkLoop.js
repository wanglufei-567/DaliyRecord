import {
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority
} from './scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import {
  NoFlags,
  MutationMask,
  Placement,
  Update,
  ChildDeletion,
  Passive
} from './ReactFiberFlags';
import {
  commitMutationEffectsOnFiber, //执行DOM操作
  commitPassiveUnmountEffects, //执行destroy
  commitPassiveMountEffects, //执行create
  commitLayoutEffects
} from './ReactFiberCommitWork';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './ReactWorkTags';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';
import {
  NoLanes,
  markRootUpdated,
  getNextLanes,
  getHighestPriorityLane,
  SyncLane,
  includesBlockingLane
} from './ReactFiberLane';
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  setCurrentUpdatePriority
} from './ReactEventPriorities';
import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import {
  scheduleSyncCallback,
  flushSyncCallbacks
} from './ReactFiberSyncTaskQueue';

// 正在进行中的工作，也就是正在计算中的fiber
let workInProgress = null;
//正在构建中的根节点
let workInProgressRoot = null;
//此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
//具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let rootWithPendingPassiveEffects = null;
// 当前渲染的优先级
let workInProgressRootRenderLanes = NoLanes;

//构建fiber树正在进行中
const RootInProgress = 0;
//构建fiber树已经完成
const RootCompleted = 5;
//当渲染工作结束的时候当前的fiber树处于什么状态,默认进行中
let workInProgressRootExitStatus = RootInProgress;

/**
 * @description 在fiber上调度更新 也就是计划更新root
 * 源码中此处有一个任务的功能，这里后续再实现
 * @param root 根 FiberRootNode
 * @param lane 车道 初次渲染时是默认事件车道 DefaultLane 16
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  // 给当根 root 标记更新的车道
  markRootUpdated(root, lane);
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root) {
  //获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes); //16
  //如果没有要执行的任务
  if (nextLanes === NoLanes) {
    return;
  }

  //获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes); //16
  //新的回调任务
  let newCallbackNode;

  if (newCallbackPriority === SyncLane) {
    //如果新的优先级是同步的话

    //先把performSyncWorkOnRoot添回到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    //再把flushSyncCallbacks放入微任务
    queueMicrotask(flushSyncCallbacks);
    //如果是同步执行的话
    newCallbackNode = null;
  } else {
    //如果不是同步，就需要调度一个新的任务

    // 调度的优先级
    let schedulerPriorityLevel;

    switch (
      lanesToEventPriority(nextLanes) //将lane转成事件优先级
    ) {
      //离散事件优先级 click onchange
      case DiscreteEventPriority:
        // 立刻执行优先级 1
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;

      //连续事件的优先级 mousemove
      case ContinuousEventPriority:
        //用户阻塞操作优先级 2 用户点击 ，用户输入
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;

      //默认事件车道
      case DefaultEventPriority:
        // 正常优先级 3
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;

      //空闲事件优先级
      case IdleEventPriority:
        // 空闲优先级 5
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;

      default:
        // 正常优先级 3
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }

    // 调度执行更新任务
    // newCallbackNode是scheduleCallback创建的任务newTask
    // newTask.callback是performConcurrentWorkOnRoot
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  //在根节点记录当前执行的任务是newCallbackNode
  root.callbackNode = newCallbackNode;
}

/**
 * 在根上执行同步工作
 */
function performSyncWorkOnRoot(root) {
  //获得最高优的lane
  const lanes = getNextLanes(root);
  //渲染新的fiber树
  renderRootSync(root, lanes);
  //获取新渲染完成的fiber根节点
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null;
}

/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root  根 FiberRootNode
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  console.log('performConcurrentWorkOnRoot', didTimeout);
  //先获取当前根节点上的任务
  const originalCallbackNode = root.callbackNode;

  //获取当前优先级最高的车道 初次渲染时是默认事件车道 DefaultLane 16
  const lanes = getNextLanes(root, NoLanes); //16
  if (lanes === NoLanes) {
    return null;
  }

  //如果不包含阻塞的车道，并且没有超时，就可以并行渲染,就是启用时间分片
  //所以说默认更新车道是同步的,不能启用时间分片
  const shouldTimeSlice =
    !includesBlockingLane(root, lanes) && !didTimeout;
  console.log(
    'shouldTimeSlice',
    shouldTimeSlice,
    includesBlockingLane(root, lanes),
    didTimeout
  );

  /**
   * 执行渲染，得到退出的状态，也就是fiber树的构建状态，null or 进行中 or 完成
   * 同步渲染renderRootSync返回null,等价于完成状态，因为同步渲染不会中断
   * 并发渲染renderRootConcurrent会走时间切片逻辑，5ms没将fiber树构建完成就会退出
   */
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);

  //如果不是渲染中的话，那说明肯定渲染完了
  // RootInProgress表示构建fiber树正在进行中
  if (exitStatus !== RootInProgress) {
    //开始进入提交阶段，就是执行副作用，修改真实DOM
    const finishedWork = root.current.alternate;
    // FiberRootNode上记录新HostRootFiber
    root.finishedWork = finishedWork;
    commitRoot(root);
  }

  //说明任务没有完成
  if (root.callbackNode === originalCallbackNode) {
    /**
     * 将此函数返回，下个时间切片继续执行
     * scheduler中的workLoop中判断若是callback返回值是函数，
     * 则任务继续，最小堆中任务没有被清出
     * 下个时间切片继续执行这个任务
     * 另外由于全局变量workInProgress记录下了fiber树构建到哪个节点
     * 所以保证了下个时间切片中可以从正确的fiber节点继续构建
     */
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}

/**
 * @description 并发渲染方法
 */
function renderRootConcurrent(root, lanes) {
  //因为在构建fiber树的过程中，此方法会反复进入，会进入多次
  //只有在第一次进来的时候会创建新的fiber树，或者说新fiber
  if (
    workInProgressRoot !== root ||
    workInProgressRootRenderLanes !== lanes
  ) {
    prepareFreshStack(root, lanes);
  }

  /**
   * 在当前分配的时间片(5ms)内执行fiber树的构建或者说渲染
   * 一个fiber单元performUnitOfWork计算完成后，
   * 会调用scheduler的shouldYield判断当前时间切片是过期
   * 若是过期则退出循环，这里继续往下走
   * 返回fiber树的构建状态
   */
  workLoopConcurrent();

  /**
   * 如果 workInProgress不为null，说明fiber树的构建还没有完成
   * fiber树构建完成时，workInProgress为HostRootFiber的return，也就是null
   */
  if (workInProgress !== null) {
    // 返回RootInProgress表示构建fiber树还正在进行中
    return RootInProgress;
  }

  /**
   * 如果workInProgress是null了说明渲染工作完全结束了
   * 返回workInProgressRootExitStatus(当前的fiber树处于什么状态 进行中 or 完成)
   * completeUnitOfWork最后会将workInProgressRootExitStatus改成完成
   */
  return workInProgressRootExitStatus;
}

/**
 * @description 同步渲染方法
 */
function renderRootSync(root, renderLanes) {
  //如果新的根和老的根不一样，或者新的渲染优先级和老的渲染优先级不一样
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    //开始构建fiber树
    prepareFreshStack(root, renderLanes);
  }
  // 开启工作循环
  workLoopSync();
}

/**
 * @description 根据老的fiber树创建一个全新的fiber树，后续用于替换掉老的fiber树
 */
function prepareFreshStack(root, renderLanes) {
  // 创建一个workInProgress（执行中的工作）
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = renderLanes;
  workInProgressRoot = root;
  // 完成队列并发更新，完成更新队列queue的创建
  finishQueueingConcurrentUpdates();
}

/**
 * @description 并发模式的工作循环方法
 */
function workLoopConcurrent() {
  /*
    ‼️重要重要重要
    如果有下一个要构建的fiber并且时间片没有过期就继续循环
    若是shouldYield返回true表示当前时间切片过期了，需要退出循环
    退出循环后renderRootConcurrent中会返回一个值，表示当前fiber树是否构建完成
    shouldYield是scheduler中用来判断时间切片是否过期的方法
   */
  while (workInProgress !== null && !shouldYield()) {
    console.log('shouldYield()', shouldYield(), workInProgress);
    sleep(1000);
    performUnitOfWork(workInProgress);
  }
}

/**
 * @description 同步模式的工作循环方法
 */
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * @description 执行一个工作单元
 * @param unitOfWork 正在计算中的fiber
 */
function performUnitOfWork(unitOfWork) {
  //获取老fiber
  const current = unitOfWork.alternate;

  const next = beginWork(
    current,
    unitOfWork,
    workInProgressRootRenderLanes
  );

  //完成当前fiber的子fiber链表构建后，将等待生效的props标记为已经生效的props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}

/**
 * @description 完成一个工作单元的执行
 * @param unitOfWork 正在计算中的fiber
 */
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    //执行此fiber 的完成工作,如果是原生组件的话就是创建真实的DOM节点
    completeWork(current, completedWork);

    //如果有弟弟，就构建弟弟对应的fiber子链表
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    //如果没有弟弟，说明这当前完成的就是父fiber的最后一个节点
    //也就是说一个父fiber,所有的子fiber全部完成了
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);

  //如果走到了这里，说明整个fiber树全部构建完毕,把构建状态设置为完成成
  // 即将workInProgressRootExitStatus由RootInProgress(构建fiber树正在进行中)
  // 改成RootCompleted(构建fiber树已经完成)
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

/**
 * @description 执行卸载副作用 和 挂载副作用
 */
function flushPassiveEffects() {
  console.log(
    '~~~~~~~~~~~下一个宏任务中flushPassiveEffect~~~~~~~~~~~'
  );
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    //执行卸载副作用，destroy
    commitPassiveUnmountEffects(root.current);
    //执行挂载副作用 create
    commitPassiveMountEffects(root, root.current);
  }
}

/**
 * @description 提交方法
 * @param root 根节点
 */
function commitRoot(root) {
  const previousUpdatePriority = getCurrentUpdatePriority();
  try {
    //把当前的更新优先级设置为1，提交阶段的优先级最高，不能切片
    setCurrentUpdatePriority(DiscreteEventPriority);
    commitRootImpl(root);
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority);
  }
}

/**
 * @description 提交阶段的具体逻辑
 * @param root 根节点
 */
function commitRootImpl(root) {
  //先获取新的构建好的fiber树的根fiber tag=3
  const { finishedWork } = root;
  workInProgressRoot = null;
  workInProgressRootRenderLanes = null;
  root.callbackNode = null;
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true;
      Scheduler_scheduleCallback(
        NormalSchedulerPriority,
        flushPassiveEffects
      );
    }
  }
  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect =
    (finishedWork.flags & MutationMask) !== NoFlags;
  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    //当DOM执行变更之后
    commitMutationEffectsOnFiber(finishedWork, root);
    //执行layout Effect
    commitLayoutEffects(finishedWork, root);
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  //等DOM变更后，就可以把让root的current指向新的fiber树
  root.current = finishedWork;
}

/**
 * @description 请求一个更新车道
 * 先获取当前更新优先级，默认值是NoLane 没有车道
 * 若更新优先级为NoLane，则获取当前事件优先级
 * 若没有事件则，返回默认事件车道 DefaultLane 16
 */
export function requestUpdateLane() {
  // 获取当前更新优先级，默认值是NoLane 没有车道
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    return updateLane;
  }
  // 获取当前事件优先级，若没有事件则，返回默认事件车道 DefaultLane 16
  const eventLane = getCurrentEventPriority();
  return eventLane;
}

function sleep(duration) {
  const timeStamp = new Date().getTime();
  const endTime = timeStamp + duration;
  while (true) {
    if (new Date().getTime() > endTime) {
      return;
    }
  }
}

function printFinishedWork(fiber) {
  const { flags, deletions } = fiber;
  if ((flags & ChildDeletion) !== NoFlags) {
    fiber.flags &= ~ChildDeletion;
    console.log(
      '子节点有删除' +
        deletions
          .map(fiber => `${fiber.type}#${fiber.memoizedProps.id}`)
          .join(',')
    );
  }
  let child = fiber.child;
  while (child) {
    printFinishedWork(child);
    child = child.sibling;
  }

  if (fiber.flags !== NoFlags) {
    console.log(
      getFlags(fiber),
      getTag(fiber.tag),
      typeof fiber.type === 'function' ? fiber.type.name : fiber.type,
      fiber.memoizedProps
    );
  }
}
function getFlags(fiber) {
  const { flags } = fiber;
  if (flags === (Placement | Update)) {
    return '移动';
  }
  if (flags === Placement) {
    return '插入';
  }
  if (flags === Update) {
    return '更新';
  }

  return flags;
}

function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return 'FunctionComponent';
    case HostRoot:
      return 'HostRoot';
    case HostComponent:
      return 'HostComponent';
    case HostText:
      return 'HostText';
    default:
      return tag;
  }
}
