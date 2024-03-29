import logger, { indent } from 'shared/logger';
import {
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
  FunctionComponent
} from './ReactWorkTags';
import { processUpdateQueue, cloneUpdateQueue } from "./ReactFiberClassUpdateQueue";
import {
  mountChildFibers,
  reconcileChildFibers
} from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig.js';
import { renderWithHooks } from 'react-reconciler/src/ReactFiberHooks';
import { NoLane, NoLanes } from './ReactFiberLane';

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
function updateHostRoot(current, workInProgress, renderLanes) {
  const nextProps = workInProgress.pendingProps;
  // 复制更新队列
  cloneUpdateQueue(current, workInProgress);

  //根据老状态和更新队列中的更新计算最新的状态
   processUpdateQueue(workInProgress, nextProps, renderLanes);
   //workInProgress.memoizedState={ element }

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
  nextProps,
  renderLanes
) {
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes
  );
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * @description 目标是根据新虚拟DOM构建新的fiber子链表 .child .sibling
 * @param current 老fiber
 * @param workInProgress 新的fiber h1
 */
export function beginWork(current, workInProgress, renderLanes) {
  // 打印workInProgress
  // logger(' '.repeat(indent.number) + 'beginWork', workInProgress);
  // indent.number += 2;

  //在构建fiber树之后清空lanes
  /**
   * ‼️重要
   * 在处理当前fiber节点之前，将其fiber的lanes重置为NoLanes
   * 为何要重置？
   * 这是因为一个fiber上的所有lane可能无法一次更新完成
   * 会优先完成renderLanes对应的lane，优先完成的lane便需要被去除
   * 如何去除？直接重置为NoLanes，然后再重新合并计算
   * fiber上新的lanes会由被剩下的所有更新对象update中的lane合并生成
   *
   * ⚠️注意 需要区分renderLanes 和fiber.lanes
   * renderLanes是root.pendingLanes中优先级最高的lane
   * fiber.lanes是由fiber上所有更新对象update中的lane合并生成
   */
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
      /*
      React里组件有两种，一种是函数组件，一种是类组件，但是它们都是都是函数
      组件fiber的tag最开始便是IndeterminateComponent
      */
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type,
        renderLanes
      );
    case FunctionComponent: {
      const Component = workInProgress.type;
      const nextProps = workInProgress.pendingProps;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps,
        renderLanes
      );
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      return null;
    default:
      return null;
  }
}
