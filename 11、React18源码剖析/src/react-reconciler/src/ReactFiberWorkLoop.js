import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import {
  NoFlags,
  MutationMask,
  Placement,
  Update
} from './ReactFiberFlags';
import { commitMutationEffectsOnFiber } from './ReactFiberCommitWork';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';

// 正在进行中的工作，也就是正在计算中的fiber
let workInProgress = null;

/**
 * @description 在fiber上调度更新 也就是计划更新root
 * 源码中此处有一个任务的功能，这里后续再实现
 * @param root 根节点
 */
export function scheduleUpdateOnFiber(root) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root) {
  //告诉浏览器要执行performConcurrentWorkOnRoot
  // scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
  performConcurrentWorkOnRoot.bind(null, root)();
}

/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root 根节点
 */
function performConcurrentWorkOnRoot(root) {
  //第一次渲染以同步的方式渲染根节点，初次渲染的时候，都是同步
  renderRootSync(root);

  //开始进入提交 阶段，就是执行副作用，修改真实DOM
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}

/**
 * @description 提交方法
 * @param root 根节点
 */
 function commitRoot(root) {
  const { finishedWork } = root;

  // printFinishedWork(finishedWork);

  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect =
    (finishedWork.flags & MutationMask) !== NoFlags;
  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
  }

  //等DOM变更后，就可以把让root的current指向新的fiber树
  root.current = finishedWork;
}


/**
 * @description 渲染方法
 */
function renderRootSync(root) {
  //开始构建fiber树
  prepareFreshStack(root);
  // 开启工作循环
  workLoopSync();
}

/**
 * @description 根据老的fiber树创建一个全新的fiber树，后续用于替换掉老的fiber树
 */
function prepareFreshStack(root) {
  // 创建一个workInProgress（执行中的工作）
  workInProgress = createWorkInProgress(root.current, null);
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

  const next = beginWork(current, unitOfWork);

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


function printFinishedWork(fiber) {
  let child = fiber.child;
  while (child) {
    printFinishedWork(child);
    child = child.sibling;
  }
  if (fiber.flags !== 0) {
    console.log(getFlags(fiber.flags), getTag(fiber.tag), fiber.type, fiber.memoizedProps);
  }
}

function getFlags(flags) {
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