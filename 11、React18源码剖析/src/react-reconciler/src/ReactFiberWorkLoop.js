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
  IdleEventPriority
} from './ReactEventPriorities';
import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig';

// 正在进行中的工作，也就是正在计算中的fiber
let workInProgress = null;
//正在构建中的根节点
let workInProgressRoot = null;
//此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
//具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let rootWithPendingPassiveEffects = null;
// 当前渲染的优先级
let workInProgressRenderLanes = NoLanes;

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
  //获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes); //16

  if (newCallbackPriority === SyncLane) {
    //如果新的优先级是同步的话
    // TODO
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
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
}

/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root  根 FiberRootNode
 */
function performConcurrentWorkOnRoot(root) {
  //获取root上当前优先级最高的车道， 初次渲染时是默认事件车道 DefaultLane 16
  const nextLanes = getNextLanes(root, NoLanes); //16
  if (nextLanes === NoLanes) {
    return null;
  }

  const shouldTimeSlice =
    !includesBlockingLane(root, lanes) && !didTimeout;
  if (shouldTimeSlice) {
    renderRootConcurrent(root, lanes);
  } else {
    //第一次渲染以同步的方式渲染根节点，初次渲染的时候，都是同步
    renderRootSync(root, lanes);
  }

  //开始进入提交阶段，就是执行副作用，修改真实DOM
  const finishedWork = root.current.alternate;
  // FiberRootNode上记录新HostRootFiber
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null;
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
  const { finishedWork } = root;
  // printFinishedWork(finishedWork);

  workInProgressRoot = null;
  workInProgressRenderLanes = null;

  //若是新的fiber树上有Passive则说明有函数组件使用了useEffect
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    //若此根节点上有useEffect类似的副作用
    if (!rootDoesHavePassiveEffect) {
      // scheduleCallback会开启一个新的宏任务，只需执行一次即可
      rootDoesHavePassiveEffect = true;
      Scheduler_scheduleCallback(
        NormalSchedulerPriority,
        flushPassiveEffects
      );
    }
  }
  console.log('~~~~~~~~~~~~DOM执行变更前~~~~~~~~~~~~~~~~~~');
  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect =
    (finishedWork.flags & MutationMask) !== NoFlags;

  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
    console.log('~~~~~~~~~~~~DOM执行变更后~~~~~~~~~~~~~~~~~~');
    commitLayoutEffects(finishedWork, root);
    //当DOM执行变更之后
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      // 具有useEffect副作用的根节点
      rootWithPendingPassiveEffects = root;
    }

    //等DOM变更后，就可以把让root的current指向新的fiber树
    root.current = finishedWork;
  }
}

/**
 * @description 并发渲染方法
 */
 function renderRootConcurrent(root, lanes) {
  console.log(root, lanes);
}

function workLoopConcurrent() {
  //如果有下一个要构建的fiber并且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}


/**
 * @description 同步渲染方法
 */
function renderRootSync(root, renderLanes) {
  //开始构建fiber树
  prepareFreshStack(root, renderLanes);
  // 开启工作循环
  workLoopSync();
}

/**
 * @description 根据老的fiber树创建一个全新的fiber树，后续用于替换掉老的fiber树
 */
function prepareFreshStack(root, renderLanes) {
  // 创建一个workInProgress（执行中的工作）
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRenderLanes = renderLanes;
  // 完成队列并发更新，完成更新队列queue的创建
  finishQueueingConcurrentUpdates();
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
    workInProgressRenderLanes
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
