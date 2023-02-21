import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress
} from './ReactFiber';
import { Placement, ChildDeletion } from './ReactFiberFlags';
import isArray from 'shared/isArray';

/**
 * @description 返回协调子fiber的方法
 * @param shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {

  /**
   * @description 复用fiber
   * @param fiber 老的fiber节点
   * @param pendingProps 新虚拟DOM的props
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  /**
   * @description 在新的父fiber的deletions属性上记录下被删除的老的子fiber
   * @param returnFiber 新的父fiber
   * @param childToDelete 待删除的子fiber（老的）
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects)
      return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions.push(childToDelete);
    }
  }

  /**
   * @description 删除从currentFirstChild之后所有的fiber节点
   * @param returnFiber 新的父Fiber
   * @param currentFirstChild 老的父fiber第一个子fiber
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects)
      return;
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  /**
   * @description 根据虚拟DOM创建fiber（只有单个元素的情况下）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstChild 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileSingleElement(
    returnFiber,
    currentFirstChild,
    element
  ) {
    const key = element.key;
    let child = currentFirstChild;

    /*
      若更新时新的子虚拟DOM只有一个节点，且老的父fiber存在子fiber
      则需要从第一个子fiber开始，遍历老的父fiber的所有的子fiber
      判断是否有老的子fiber可以直接复用
    */
    while (child !== null) {
      //判断此老fiber对应的key和新的虚拟DOM对象的key是否一样 null===null
      if (child.key === key) {
        //判断老fiber对应的类型和新虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          // 如果key一样，类型也一样，则认为此节点可以复用,把其余老fiber删除
          deleteRemainingChildren(returnFiber, child.sibling);
          //直接复用老fiber
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          //如果找到key一样老fiber但是类型不一样，不能复用此老fiber,把老fiber全部删除
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        // key不同则直接删除当前老fiber
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    /*
      初次挂载时，老fiber节点currentFirstChild肯定是没有的
      所以可以直接根据虚拟DOM创建新的Fiber节点
    */
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   * @param newFiber 新的子fiber
   */
  function placeSingleChild(newFiber) {
    //说明要添加副作用
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      /*
        要在最后的提交阶段插入此节点
        React渲染分成渲染(创建Fiber树)和提交(更新真实DOM)二个阶段
      */
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }

  /**
   * 设置副作用
   * @param newFiber 新的子fiber
   * @param newIdx 新的子fiber对应的VDom节点在children中的索引
   */
  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx;
    if (shouldTrackSideEffects) {
      //如果一个fiber它的flags上有Placement,说明此节点需要创建真实DOM并且插入到父容器中
      //如果父fiber节点是初次挂载，shouldTrackSideEffects=false,不需要添加flags
      //这种情况下会在完成阶段把所有的子节点全部添加到自己身上
      newFiber.flags |= Placement;
    }
  }

  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个的一个新的fiber
    let newIdx = 0;

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIdx);

      //如果previousNewFiber为null，说明这是第一个fiber
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber; //这个newFiber就是大儿子
      } else {
        //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
        previousNewFiber.sibling = newFiber;
      }

      //让newFiber成为最后一个或者说上一个子fiber
      previousNewFiber = newFiber;
    }

    return resultingFirstChild;
  }

  /**
   * 协调比较子Fibers 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(
    returnFiber,
    currentFirstFiber,
    newChild
  ) {
    //新的子虚拟DOM只有一个节点的情况
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstFiber,
              newChild
            )
          );
        default:
          break;
      }
    }

    /*
      新的子节点有多个的情况
      newChild是个数组 [hello文本节点,span虚拟DOM元素]
    */
    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstFiber,
        newChild
      );
    }
    return null;
  }

  return reconcileChildFibers;
}

//有老父fiber更新的时候用这个
export const reconcileChildFibers = createChildReconciler(true);

//如果没有老父fiber,初次挂载的时候用这个
export const mountChildFibers = createChildReconciler(false);
