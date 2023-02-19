import ReactSharedInternals from "shared/ReactSharedInternals";

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染的fiber
let currentRenderingFiber = null;
// 当前正在工作的hook
let workInProgressHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer
}

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
    pending: null
  }
  hook.queue = queue;
  const dispatch = dispatchReducerAction.bind(null, currentRenderingFiber, queue);
  return [hook.memoizedState, dispatch];
}

/**
 * @description 挂载构建中的hook
 * hook是个对象
 */
 function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,//hook的状态 0
    queue: null,//存放本hook的更新队列 queue.pending=update的循环链表
    next: null //指向下一个hook,一个函数里可以会有多个hook,它们会组成一个单向链表
  };
  if (workInProgressHook === null) {
    //当前函数对应的fiber的状态等于第一个hook对象
    currentRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  console.log(fiber, queue, action);
}

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentRenderingFiber = workInProgress;//Function组件对应的fiber
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;

  //需要要函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props);
  return children;
}