import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress
} from './ReactFiber';
import { Placement, ChildDeletion } from './ReactFiberFlags';
import isArray from 'shared/isArray';
import { HostText } from './ReactWorkTags';

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
    if (!shouldTrackSideEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
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
    if (!shouldTrackSideEffects) return;
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
  function placeChild(newFiber, lastPlacedIndex, newIdx) {
    //指定新的fiber在新的挂载索引
    newFiber.index = newIdx;
    //如果不需要跟踪副作用
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    //获取它的老fiber
    const current = newFiber.alternate;
    if (current !== null) {
      //如果有，说明这是一个更新的节点，有老的真实DOM
      const oldIndex = current.index;
      //如果找到的老fiber的索引比lastPlacedIndex要小，则老fiber对应的DOM节点需要移动
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      /*
      如果没有，说明这是一个新的节点，需要插入
      如果一个fiber它的flags上有Placement,说明此节点需要创建真实DOM并且插入到父容器中

      如果父fiber节点是初次挂载，也就是shouldTrackSideEffects=false时,不需要添加flags，这种情况下会在完成阶段把所有的子节点全部添加到自己身上
      */
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  /**
   * @description 复用老fiber或者创建新的fiber
   * @param returnFiber 新的父fiber
   * @param current 老的子fiber
   * @param element 新的子虚拟DOM
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      //判断是否类型一样，则表示key和type都一样，可以复用老的fiber和真实DOM
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * @description 试图复用老的fiber
   * 能复用就复用，不能就创建新的
   * @param returnFiber 新的父fiber
   * @param oldFiber 老的子fiber
   * @param newChild 新的子虚拟DOM节点
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === 'object') {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          //如果key一样，进入更新元素的逻辑
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default:
          return null;
      }
    }
    return null;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild != null) {
      //如果有key用key,如果没有key使用索引
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFromMap(
    existingChildren,
    returnFiber,
    newIdx,
    newChild
  ) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild);
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;
          return updateElement(returnFiber, matchedFiber, newChild);
        }
      }
    }
  }

  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChildren 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个新子fiber
    let newIdx = 0; //用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstFiber; //第一个老fiber
    let nextOldFiber = null; //下一个老fiber
    let lastPlacedIndex = 0; //上一个不需要移动的老节点的索引

    // 开始第一轮循环 如果老fiber有值，新的虚拟DOM也有值
    for (
      ;
      oldFiber !== null && newIdx < newChildren.length;
      newIdx++
    ) {
      //先暂存下一个老fiber
      nextOldFiber = oldFiber.sibling;
      //试图复用老的fiber
      const newFiber = updateSlot(
        returnFiber, // 新的父Fiber
        oldFiber, // 老fiber
        newChildren[newIdx] // 新子虚拟DOM节点
      );
      if (newFiber === null) {
        // 没有复用的或者创建的新子fiber，就进行下个新子虚拟DOM节点的处理
        break;
      }
      if (shouldTrackSideEffects) {
        //如果有老fiber,但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber,在提交阶段会删除真实DOM
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      //指定新fiber的位置
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber; //li(A).sibling=p(B).sibling=>li(C)
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    //新的虚拟DOM已经循环完毕，3=>2
    if (newIdx === newChildren.length) {
      //删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    //如果老的 fiber已经没有了， 新的虚拟DOM还有，进入插入新节点的逻辑
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(
          returnFiber,
          newChildren[newIdx]
        );
        if (newFiber === null) continue;
        lastPlacedIndex = placeChild(
          newFiber,
          lastPlacedIndex,
          newIdx
        );
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
    }

    // 开始处理移动的情况
    const existingChildren = mapRemainingChildren(
      returnFiber,
      oldFiber
    );
    //开始遍历剩下的虚拟DOM子节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          //如果要跟踪副作用，并且有老fiber
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        //指定新的fiber存放位置 ，并且给lastPlacedIndex赋值
        lastPlacedIndex = placeChild(
          newFiber,
          lastPlacedIndex,
          newIdx
        );
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber; //这个newFiber就是大儿子
        } else {
          //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
          previousNewFiber.sibling = newFiber;
        }
        //让newFiber成为最后一个或者说上一个子fiber
        previousNewFiber = newFiber;
      }
    }
    if (shouldTrackSideEffects) {
      //等全部处理完后，删除map中所有剩下的老fiber
      existingChildren.forEach(child =>
        deleteChild(returnFiber, child)
      );
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
