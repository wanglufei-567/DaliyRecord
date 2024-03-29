import {
  appendChild,
  insertBefore,
  commitUpdate,
  removeChild
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import {
  Placement,
  MutationMask,
  Update,
  Passive,
  LayoutMask,
  Ref
} from './ReactFiberFlags';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './ReactWorkTags';
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout
} from './ReactHookEffectTags';

// 原生的父节点 真实DOM
let hostParent = null;

/**
 * @description 把子节点对应的真实DOM插入到父节点DOM中
 * @param {*} node 将要插入的fiber节点
 * @param {*} parent 父真实DOM节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  //判断此fiber对应的节点是不是真实DOM节点
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    //如果是的话直接添加
    const { stateNode } = node;
    // 有锚点则执行插入，没有锚点则执行追加
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    //如果node不是真实的DOM节点，获取它的第一个子fiber
    const { child } = node;
    if (child !== null) {
      //递归执行，把第一个子fiber也添加到父亲DOM节点里面去
      insertOrAppendPlacementNode(child, before, parent);

      //把其余子fiber添加到父亲DOM节点里面去
      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

/**
 * @description 找到要插入的锚点
 * @description 找到可以插在它的前面的那个fiber对应的真实DOM
 * @param {*} fiber
 */
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    // 向上寻找sibling直到没有父fiber或者父fiber是原生节点fiber或者根fiber
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;

    //如果弟弟不是原生节点也不是文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      //如果此节点是一个将要插入的新的节点，找它的弟弟
      if (node.flags & Placement) {
        continue siblings;
      } else {
        node = node.child;
      }
    }

    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

/**
 * @description 判断当前fiber是否是原生节点fiber或者根fiber
 */
function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag == HostRoot; //div#root
}

/**
 * @description 根据当前fiber向上寻找，直到找到原生节点fiber或者根fiber
 */
function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

/**
 * @description 把此fiber的真实DOM插入到父DOM里
 * @param {*} finishedWork
 */
function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      //获取最近的弟弟真实DOM节点
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      //获取最近的弟弟真实DOM节点
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    default:
      break;
  }
}

/**
 * @description 递归遍历所有子节点执行删除副作用
 * @param {*} finishedRoot 根节点
 * @param {*} nearestMountedAncestor 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(
      finishedRoot,
      nearestMountedAncestor,
      child
    );
    child = child.sibling;
  }
}

/**
 * @description 删除真实DOM
 * @param {*} finishedRoot 根节点
 * @param {*} nearestMountedAncestor 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber
) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      //当要删除一个节点的时候，要先删除它的子节点
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      //再把自己删除，从父真实DOM节点上删除child（deletedFiber.stateNode）
      if (hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode);
      }
      break;
    }
    default:
      break;
  }
}
/**
 * @description 提交删除副作用
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber;
  //一直向上找，找到真实的父DOM节点为此
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent: {
        hostParent = parent.stateNode;
        break findParent;
      }
      case HostRoot: {
        hostParent = parent.stateNode.containerInfo;
        break findParent;
      }
    }
    parent = parent.return;
  }
  // 删除deletedFiber对应的真实DOM
  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
  hostParent = null;
}

/**
 * @description 递归遍历fiber树，处理副作用
 * @param root 根 FiberRootNode
 * @param parentFiber fiber节点
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  //先把父fiber上该删除的节点对应的真实DOM都删除
  // 先处理删除副作用再处理插入副作用
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }
  //再去处理剩下的子节点
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

/**
 * @description 完成真实DOM的添加
 * @description 删除副作用
 * @param finishedWork fiber节点
 */
function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  //如果此fiber要执行插入操作的话
  if (flags & Placement) {
    //进行插入操作，也就是把此fiber对应的真实DOM节点添加到父真实DOM节点上
    commitPlacement(finishedWork);
    //把flags里的Placement删除
    finishedWork.flags & ~Placement;
  }
}

/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case FunctionComponent:
    case HostRoot:
    case HostText: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case HostComponent: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      // 提交附加的ref，给ref绑定真实DOM节点
      if (flags & Ref) {
        commitAttachRef(finishedWork);
      }
      //处理DOM更新
      if (flags & Update) {
        //获取真实DOM
        const instance = finishedWork.stateNode;
        //更新真实DOM
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps =
            current !== null ? current.memoizedProps : newProps;

          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;

          if (updatePayload) {
            commitUpdate(
              instance, // 真实DOM
              updatePayload, // 更新内容
              type, // 真实DOM type
              oldProps, // 老props
              newProps, // 新Props
              finishedWork // 当前的fiber节点
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }
}

function commitAttachRef(finishedWork) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    if (typeof ref === 'function') {
      ref(instance);
    } else {
      ref.current = instance;
    }
  }
}

/**
 * @description 执行卸载副作用，destroy
 * @param finishedWork 根fiber
 */
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}

function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    }
    case FunctionComponent: {
      // 先处理子节点的
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      // 再处理自己
      if (flags & Passive) {
        // 如果函数组件的里面使用了useEffect,那么此函数组件对应的fiber上会有一个Passive flag
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
    }
  }
}
/**
 * @description 递归遍历子fiber节点,处理子节点的副作用
 */
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}

/**
 * @description 执行自己的卸载副作用
 */
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}

/**
 * @description 提交卸载副作用
 */
function commitHookEffectListUnmount(flags, finishedWork) {
  // 获取函数组件上的更新队列
  const updateQueue = finishedWork.updateQueue;
  const lastEffect =
    updateQueue !== null ? updateQueue.lastEffect : null;

  if (lastEffect !== null) {
    //获取 第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      //如果此effect的tag和传入的fiber flag相同
      //都是 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          // 执行卸载副作用函数
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

/**
 * @description 执行挂载副作用 create
 * @param finishedWork 根fiber
 */
export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork
      );
      break;
    }
    case FunctionComponent: {
      // 先处理子节点
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork
      );
      // 再处理自己
      if (flags & Passive) {
        // 如果函数组件的里面使用了useEffect,那么此函数组件对应的fiber上会有一个Passive flag
        commitHookPassiveMountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
    }
  }
}
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
/**
 * @description 提交挂载副作用
 */
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect =
    updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    //获取 第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      //如果此effect tag和传入的fiber flags 相同
      //都是 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const create = effect.create;
        // 执行挂载副作用函数，并将其返回值，也就是卸载副作用赋值给effect的destroy
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}


export function commitLayoutEffects(finishedWork, root) {
  //老的根fiber
  const current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork);
}

function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & LayoutMask) {// LayoutMask=Update=4
        commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
      }
      break;
    }
  }
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child;
    while (child !== null) {
      const current = child.alternate;
      commitLayoutEffectOnFiber(root, current, child);
      child = child.sibling;
    }
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
