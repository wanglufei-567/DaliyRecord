import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import { Passive as PassiveEffect } from './ReactFiberFlags';
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive
} from './ReactHookEffectTags';

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染的fiber
let currentlyRenderingFiber = null;
// 当前正在工作的hook
let workInProgressHook = null;
// 老hook
let currentHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect
};

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
    dispatch: null
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
  //在每个hook里会存放一个更新队列
  //更新队列是一个更新对象的循环链表update1.next=update2.next=update1
  const update = {
    action, //{ type: 'add', payload: 1 } 派发的动作
    next: null //指向下一个更新对象
  };
  //把当前的最新的更添的添加更新队列中，并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  // 调度更新，重新渲染 需要注意这个是宏任务，所以多次dispatch会批量更新
  scheduleUpdateOnFiber(root);
}
/* ----------------------------------------------------------------------- */

/**
 * @description 挂载useState
 * @param initialState 初始值
 */
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
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
  // 创建更新对象
  const update = {
    action,
    hasEagerState: false, //是否有急切的更新
    eagerState: null, //急切的更新状态
    next: null
  };

  //当用户派发动作后，立刻用上一次的状态和上一次的reducer计算新状态
  const { lastRenderedReducer, lastRenderedState } = queue;
  const eagerState = lastRenderedReducer(lastRenderedState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  //若本次更新的状态eagerState和上次的状态lastRenderedState一样的，则直接退出不进行更新操作
  if (Object.is(eagerState, lastRenderedState)) {
    return;
  }
  //下面是真正的入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

/* ----------------------------------------------------------------------- */

/**
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

/* function mountLayoutEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
} */

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
 * @description 挂载构建中的hook
 * hook是个对象
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, //hook的状态 0
    queue: null, //存放本hook的更新队列 queue.pending=update的循环链表
    next: null //指向下一个hook,一个函数里可以会有多个hook,它们会组成一个单向链表
  };
  if (workInProgressHook === null) {
    //当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect
};

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
    next: null
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

function updateReducer(reducer) {
  //获取新的hook
  const hook = updateWorkInProgressHook();
  //获取新的hook的更新队列
  const queue = hook.queue;
  //获取老的hook
  const current = currentHook;
  //获取将要生效的更新队列
  const pendingQueue = queue.pending;
  //初始化一个新的状态，取值为当前的状态
  let newState = current.memoizedState;

  // 处理hook上的更新队列
  if (pendingQueue !== null) {
    // 断开pending
    queue.pending = null;
    // 获取更新队列上第一个更新对象
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    // 使用用户自定义的reducer计算新状态
    do {
      if (update.hasEagerState) {
        newState = update.eagerState;
      } else {
        const action = update.action;
        newState = reducer(newState, action);
      }
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  // 将新状态添加到hook上，并返回给组件使用
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

function updateState() {
  return updateReducer(baseStateReducer);
}

/**
 * @description 更新时的useEffect
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
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
  props
) {
  currentlyRenderingFiber = workInProgress; //Function组件对应的fiber
  //清空更新队列
  workInProgress.updateQueue = null;
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
  return children;
}
