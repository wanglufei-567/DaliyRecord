import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  scheduleUpdateOnFiber,
  requestUpdateLane,
  requestEventTime
} from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import {
  Passive as PassiveEffect,
  Update as UpdateEffect
} from './ReactFiberFlags';
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout
} from './ReactHookEffectTags';
import {
  NoLane,
  NoLanes,
  isSubsetOfLanes,
  mergeLanes
} from './ReactFiberLane';

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染的fiber
let currentlyRenderingFiber = null;
// 当前正在工作的hook
let workInProgressHook = null;
// 老hook
let currentHook = null;

let renderLanes = NoLanes;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useRef: mountRef
};

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useRef: updateRef
};

/**
 * @description 挂载构建中的hook
 * hook是个对象
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, //hook的状态 0
    queue: null, //存放本hook的更新队列 queue.pending=update的循环链表
    next: null, //指向下一个hook,一个函数里可以会有多个hook,它们会组成一个单向链表
    baseState: null, //第一跳过的更新前的状态
    baseQueue: null //跳过的更新的链表
  };
  if (workInProgressHook === null) {
    //当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

/**
 * @description 构建新的hooks
 */
function updateWorkInProgressHook() {
  //获取将要构建的新的hook的老hook
  if (currentHook === null) {
    // 获取老fiber
    const current = currentlyRenderingFiber.alternate;
    //获取老hook
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  //根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue
  };

  if (workInProgressHook === null) {
    // 新fiber的memoizedState挂上新hook
    currentlyRenderingFiber.memoizedState = workInProgressHook =
      newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

/* -------------------------useRef-start------------------------------ */

function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = {
    current: initialValue
  };
  // useRef的hook对象上的memoizedState是ref对象
  hook.memoizedState = ref;
  return ref;
}

function updateRef() {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
/* -------------------------useRef-end------------------------------ */

/* -------------------------useReducer-start------------------------------ */
/**
 * @description 挂载Reducer这个hook
 * @param reducer 用户创建的reducer方法，useReducer(reducer, initialArg)
 * @param initialArg 初始值
 */
function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  // useReducer hook上的memoizedState存的就是组件中用的状态
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialArg
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新渲染
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  // 获取当前的更新赛道
  const lane = requestUpdateLane();

  //在每个hook里会存放一个更新队列
  //更新队列是一个更新对象的循环链表update1.next=update2.next=update1
  const update = {
    action, //{ type: 'add', payload: 1 } 派发的动作
    next: null //指向下一个更新对象
  };

  //把当前的最新的更添的添加更新队列中，并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(
    fiber,
    queue,
    update,
    lane
  );
  // 调度更新，重新渲染 需要注意这个是宏任务，所以多次dispatch会批量更新
  const eventTime = requestEventTime();
  scheduleUpdateOnFiber(root, fiber, lane, eventTime);
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;
  const current = currentHook;
  let baseQueue = current.baseQueue;
  const pendingQueue = queue.pending;
  //把新旧更新链表合并
  if (pendingQueue !== null) {
    if (baseQueue !== null) {
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }
  if (baseQueue !== null) {
    printQueue(baseQueue);
    const first = baseQueue.next;
    let newState = current.baseState;
    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
      const shouldSkipUpdate = !isSubsetOfLanes(
        renderLanes,
        updateLane
      );
      if (shouldSkipUpdate) {
        const clone = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        /**
         * ‼️重要
         * 这里重置了当前fiber的lanes
         * 重置为了所有被跳过的更新的lanes
         * 为什么会被重置呢？
         * 这是因为在beginWork中会将当前fiber的lanes直接重置为NoLanes
         * 这里再重新赋值
         */
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane
        );

      } else {
        if (newBaseQueueLast !== null) {
          const clone = {
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        if (update.hasEagerState) {
          newState = update.eagerState;
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);
    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = newState;
  }
  if (baseQueue === null) {
    queue.lanes = NoLanes;
  }
  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

/**
 * 调试代码
 */
function printQueue(queue) {
  const first = queue.next;
  let desc = '';
  let update = first;
  do {
    desc += '=>' + update.action.id;
    update = update.next;
  } while (update !== null && update !== first);
  desc += '=>null';
  console.log(desc);
}
/* -------------------------useReducer-end------------------------------ */

/* -------------------------useState-start------------------------------ */

/**
 * @description 挂载useState
 * @param initialState 初始值
 */
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = hook.baseState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer, //上一个reducer
    lastRenderedState: initialState //上一个state
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

//useState其实就是一个内置了reducer的useReducer
function baseStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

/**
 * @description useState的更新方法
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchSetState(fiber, queue, action) {
  /**
   * ‼️重要
   * setState触发的更新的lane就是这里添加到更新对象update上的
   * 默认setState的lane为16
   * 其他事件中的setState的lane为对应事件的lane
   * 比如点击事件中的setState的lane为1
   */
  // 获取当前的更新赛道
  const lane = requestUpdateLane();
  // 创建更新对象
  const update = {
    lane,
    action,
    hasEagerState: false, //是否有急切的更新
    eagerState: null, //急切的更新状态
    next: null
  };
  const alternate = fiber.alternate;

  /**
   * eager 急切的
   * 当派发动作后，立刻用上一次的状态和上一次的reducer计算新状态
   * 在dispatch时就开始计算，不用等到scheduleUpdateOnFiber调度更新后，
   * 再执行当前函数组件时在updateState中计算
   * 这么做的好处有两点
   * 1、若是新旧状态一致，便不用调度更新
   * 2、在dispatch时就计算好，调度更新时直接使用即可，减少更新时的计算时间
   * 主要注意⚠️的是：只有第一个dispatch更新都能进行此项优化，
   * 这是因为updateState检查hasEagerState为true后，会直接使用eagerState作为新状态
   * 若是多次更新都走eagerState的逻辑，会导致只有最后一个更新生效
   */
  if (
    fiber.lanes === NoLanes &&
    (alternate === null || alternate.lanes == NoLanes)
  ) {
    //先获取队列上的老的状态和老的reducer
    const { lastRenderedReducer, lastRenderedState } = queue;
    //使用上次的状态和上次的reducer结合本次action进行计算新状态
    const eagerState = lastRenderedReducer(lastRenderedState, action);
    update.hasEagerState = true;
    update.eagerState = eagerState;
    //若本次更新的状态eagerState和上次的状态lastRenderedState一样的，则直接退出不进行更新操作
    if (Object.is(eagerState, lastRenderedState)) {
      return;
    }
  }
  //下面是真正的入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(
    fiber,
    queue,
    update,
    lane
  );

  /**
   * 每次dispatch的当前时间都要给到scheduleUpdateOnFiber
   * 用于后续计算当前lane的过期时间
   */
  // 当前更新发生的时间
  const eventTime = requestEventTime();
  scheduleUpdateOnFiber(root, fiber, lane, eventTime);
}

function updateState(initialState) {
  return updateReducer(baseStateReducer, initialState);
}
/* -------------------------useState-end------------------------------ */

/* -------------------------useEffect-start------------------------------ */

/**
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountLayoutEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}

/**
 * @param fiberFlags fiber的flag标识
 * @param hookFlags hook的flag标识
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  // 提前缓存依赖数组
  const nextDeps = deps === undefined ? null : deps;
  //给当前的函数组件fiber添加flags
  currentlyRenderingFiber.flags |= fiberFlags;
  // Effect hook对象上的memoizedState保存的是effect链表
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}

/**
 * 添加effect链表
 * @param {*} tag effect的标签
 * @param {*} create 创建方法
 * @param {*} destroy 销毁方法
 * @param {*} deps 依赖数组
 */
function pushEffect(tag, create, destroy, deps) {
  // 创建effect对象
  const effect = {
    tag, // effect标识
    create, // 副作用函数
    destroy, // 销毁方法
    deps, // 依赖数组
    next: null
  };
  // 当前函数组件fiber的updateQueue指向effect链表
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null
  };
}

/**
 * @description 更新时的useEffect
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

/**
 * @description 更新时的useLayoutEffect
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy;
  //上一个老hook
  if (currentHook !== null) {
    //从老useEffect hook上获取老effect对象 {create deps destroy}
    const prevEffect = currentHook.memoizedState;
    //获取销毁方法
    destroy = prevEffect.destroy;

    // 若是有依赖数组则进行对比
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 用新数组和老数组进行对比，如果一样的话，则直接退出
        //不管要不要重新执行，都需要把新的effect组成完整的循环链表放到fiber.updateQueue
        hook.memoizedState = pushEffect(
          hookFlags,
          create,
          destroy,
          nextDeps
        );
        return;
      }
    }
  }
  //如果要执行副作用函数的话，需要修改fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags;
  //如果要执行副作用函数的话，需要给hook对象添加HookHasEffect flag
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return null;
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
/* -------------------------useEffect-end------------------------------ */

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  nextRenderLanes
) {
  //当前正在渲染的车道
  renderLanes = nextRenderLanes;
  //Function组件对应的fiber
  currentlyRenderingFiber = workInProgress;
  //清空更新队列
  workInProgress.updateQueue = null;
  //函数组件状态存的hooks的链表
  workInProgress.memoizedState = null;
  //如果有老的fiber,并且有老的hook链表
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  //需要要函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  renderLanes = NoLanes;
  return children;
}
