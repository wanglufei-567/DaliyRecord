import logger, { indent } from 'shared/logger';
import {
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
  FunctionComponent
} from './ReactWorkTags';
import { processUpdateQueue } from './ReactFiberClassUpdateQueue';
import {
  mountChildFibers,
  reconcileChildFibers
} from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig.js';
import { renderWithHooks } from 'react-reconciler/src/ReactFiberHooks';

/**
 * @description 协调子fiber 根据新的虚拟DOM生成新的Fiber链表
 * @param current 老的父Fiber
 * @param workInProgress 新的父Fiber
 * @param nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  /*
    如果此fiber没能对应的老fiber,说明此fiber是新创建的，
    如果这个父fiber是新的创建的，它的儿子们也肯定都是新创建的
   */
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren
    );
  } else {
    /*
      如果说有老Fiber的话，做DOM-DIFF
      拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新
    */
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

/**
 * @description 构建根fiber的子fiber链表
 * @param current 老fiber
 * @param workInProgress 新fiber h1
 */
function updateHostRoot(current, workInProgress) {
  //根据老状态和更新队列中的更新计算最新的状态
  processUpdateQueue(workInProgress);

  // 拿到最新的状态
  const nextState = workInProgress.memoizedState;
  // nextChildren就是新的子虚拟DOM
  const nextChildren = nextState.element;

  // 根据新的虚拟DOM生成子fiber链表 （DOM diff就在这里做的）
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child; //{tag:5,type:'h1'}
}

/**
 * @description 构建原生组件的子fiber链表
 * @param current 老fiber
 * @param workInProgress 新fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  // 当前fiber的pendingProps是对应VDom的props属性，其中包含了children属性
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;

  //判断当前虚拟DOM它的儿子是不是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * @description 挂未确定的组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * @param {*} Component workInProgress.type 组件类型，也就是函数组件的定义
 */
export function mountIndeterminateComponent(
  current,
  workInProgress,
  Component
) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(
    current,
    workInProgress,
    Component,
    props
  );
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, value);
  return workInProgress.child;
}

/**
 * @description 更新函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * @param {*} Component workInProgress.type 组件类型，也就是函数组件的定义
 * @param nextProps workInProgress.pendingProps 新VDom的props
 */
export function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps
) {
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps
  );
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * @description 目标是根据新虚拟DOM构建新的fiber子链表 .child .sibling
 * @param current 老fiber
 * @param workInProgress 新的fiber h1
 */
export function beginWork(current, workInProgress) {
  // 打印workInProgress
  // logger(' '.repeat(indent.number) + 'beginWork', workInProgress);
  // indent.number += 2;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
      /*
      React里组件有两种，一种是函数组件，一种是类组件，但是它们都是都是函数
      组件fiber的tag最开始便是IndeterminateComponent
      */
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case FunctionComponent: {
      const Component = workInProgress.type;
      const nextProps = workInProgress.pendingProps;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps
      );
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}
