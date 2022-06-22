import {
  ShapeFlags,
  Text,
  isSameVNode,
  normalizeVNode,
  Fragment
} from './createVNode';
import { ReactiveEffect } from 'packages/reactivity/src/effect';
import { invokerFns } from '@vue/shared';
import { createComponentInstance, setupComponent } from './component';
import { queueJob } from './scheduler';

/**
 * 获取最长递增子序列的方法
 */
function getSequence(arr) {
  // 最终的结果是索引
  const len = arr.length;
  const result = [0]; // 结果集 存放的是索引值
  const p = new Array(len).fill(0); // 里面内容无所谓 和原本的数组相同 用来存放索引

  let lastIndex;
  let start;
  let end;
  let middle;

  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      // 0 在vue3中意味着新增节点，不计入最长递增子序列列表

      // 取到数组中的最后一项的索引值
      lastIndex = result[result.length - 1];

      if (arr[lastIndex] < arrI) {
        // 若是当前项比 结果集result 中最后一项大

        // 让当前的这一项记录其前一项的索引
        p[i] = lastIndex;
        // 直接将索引放入结果集result
        result.push(i);
        continue;
      }

      /**
       * 当前项比 结果集result 中最后一项小进行二分查找
       * 当 start === end
       * 就找到了结果集中最接近与当前项的值
       * 若是当前项小于该值则进行替换
       */
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = Math.floor((start + end) / 2);
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[end]]) {
        p[i] = result[end - 1];
        result[end] = i;
      }
    }
  }
  // 倒叙追溯 先取到结果集中的最后一个
  let i = result.length;
  let last = result[i - 1];

  while (i-- > 0) {
    // 当检索后停止
    result[i] = last; // 最后一项是正确的
    last = p[last]; // 根据最后一项 向前追溯
  }
  return result;
}

export function createRenderer(options) {
  // 传入进来的renderOptions，内部属性都是DOM Api
  let {
    patchProp: hostPatchProp, // 对节点属性的操作
    createElement: hostCreateElement, // 创建元素
    createTextNode: hostCreateTextNode, // 创建文本
    querySelector: hostQuerySelector,
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = options;

  /**
   * 挂载children的方法
   */
  function mountChildren(
    children,
    container,
    anchor,
    parentComponent
  ) {
    for (let i = 0; i < children.length; i++) {
      // 格式化children child 可能是文本 需要把文本也变成虚拟节点
      let child = normalizeVNode(children, i);
      // 递归渲染子节点
      patch(null, child, container, anchor, parentComponent);
    }
  }

  /**
   * 元素类型的VNode的挂载
   * @param vnode 虚拟节点
   * @param container 父容器
   * @param anchor 锚点 用于真实节点的insert操作
   * mountElement被递归调用，不断的将根据VNode生成的真实节点insert到父容器中
   * 最终生成完整的DOM，
   * 最后再将DOM insert到根节点（用户指定的真实节点）上
   * 便完成挂载
   */
  function mountElement(vnode, container, anchor, parentComponent) {
    let { type, props, children, shapeFlag } = vnode;

    /**
     * 创建真实节点
     * 并保存在VNode的el属性上保存下来
     * 后续需要比对虚拟节点的差异，更新页面
     * 所以需要保留对应的真实节点
     */
    let el = (vnode.el = hostCreateElement(type));

    if (props) {
      // 更新属性
      patchProps(null, props, el);
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // children是文本，直接设置真实节点的文本内容即可
      hostSetElementText(el, children);
    }
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // children是数组，则需要进一步处理
      mountChildren(children, el, anchor, parentComponent);
    }

    /**
     * 挂载操作
     * 将根据VNode生成的真实节点el挂载到父容器中
     */
    hostInsert(el, container, anchor);
  }

  /**
   * 更新属性的方法
   */
  function patchProps(oldProps, newProps, el) {
    if (oldProps == null) oldProps = {};
    if (newProps == null) newProps = {};

    // 循环newProps覆盖oldProps
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // oldProps中有的，但newProps没有的，要删除
    for (let key in oldProps) {
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  }

  /**
   * children diff 方法
   * @param {Array} c1 旧的children
   * @param {Array} c2 新的的children
   * @param el 真实的DOM节点（对于c1、c2来说是父节点）
   * diff c1 和 c2 两个数组之间的差异并进行更新
   * 原则：尽可能复用节点，而且找到变化的位置
   */
  function patchKeyedChildren(c1, c2, el, parentComponent) {
    /**
     * i、e1、e2可以理解为指针，指针指向的是children中某一个child
     * i指向的是sync from start方向的指针
     * e1、e2指向的是sync from end方向的指针
     */
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    /**
     * 1. sync from start 从头开始比对
     * 遇到不同的就结束
     * (a b) c
     * (a b)
     * 当 i > e2 说明新的比对完成了，但是旧的还有剩余
     * 也就是说i 到 e1之间的内容就是要删除的
     * (a b)
     * (a b) c
     * 当i > e1 说明旧的全部比对完成，但是新的还有剩余
     * 也就是说i 到 e2之间的内容就是要新增的
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = normalizeVNode(c2, i);
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }

    /**
     * 2. sync from end 从尾部开始比对
     * 遇到不同的就结束
     * d e (a b c)
     *     (a b c)
     * 当i > e2 说明新的全部比对完成，但是旧的还有剩余
     * 也就是说i 到 e1之间的内容就是要删除的
     *   (a b)
     * c (a b)
     * 当 i > e1，说明旧的全部比对完成，但是新的还有剩余
     * 也就是说i 到 e2之间的内容是要新增的
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    if (i > e1) {
      /**
       * 3. common sequence + mount
       * (a b)
       * (a b) c
       * i = 2, e1 = 1, e2 = 2
       *   (a b)
       * c (a b)
       * i = 0, e1 = -1, e2 = 0
       */
      if (i <= e2) {
        /**
         * 确定锚点anchor，e2若是c2的最后一项，则锚点为null
         * 将新子节点c2[i]直接appendChild到父节点上
         * 否则将新子节点c2[i] insertBefore 到锚点前
         */
        const nextPos = e2 + 1;
        let anchor = c2.length <= nextPos ? null : c2[nextPos].el;

        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      /**
       * 4. common sequence + unmount
       * (a b) c
       * (a b)
       * i = 2, e1 = 2, e2 = 1
       * a (b c)
       *   (b c)
       * i = 0, e1 = 0, e2 = -1
       */
      while (i <= e1) {
        unmount(c1[i], parentComponent);
        i++;
      }
    } else {
      /**
       * 5. unknown sequence
       * [i ... e1]: a b [c d e] f g
       * [i ... e2]: a b [e d c h] f g
       * i = 2
       * e1 = 4, e2 = 5
       * s1 = 2, s2 = 2
       */
      const s1 = i;
      const s2 = i;

      /**
       * 使用Map存储child的索引值，key是子节点的属性key
       */
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(c2[i].key, i);
      }

      /**
       * 循环遍历旧的children剩下的部分进行比对
       * 若遍历到的child在新的children中找不到相同key的child，则直接unmount
       * 若是能找到则进行patch
       * [i ... e1]: a b [c d e] f g
       * [i ... e2]: a b [e c d h] f g
       * 遍历 [c d e]
       * s1 = 2 e1 = 4
       * s2 = 2 e2 = 5
       * newIndexToOldMapIndex长度为4 [e d c h]的长度
       */

      const toBePatched = e2 - s2 + 1; // 新的children 剩下乱序部分 的长度
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (let i = s1; i <= e1; i++) {
        const oldVNode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVNode.key);
        if (newIndex == null) {
          // 新的里面找不到了，说明要移除掉
          unmount(oldVNode, parentComponent);
        } else {
          /**
           * 记录下来可以旧的children中可以复用的child的索引
           * 新的位置和老的位置做一个关联
           * [c d e]
           * [e c d h]
           * newIndexToOldIndexMap = [4+1, 2+1, 3+1, 0+1] = [5, 3, 4, 1]
           * 为什么要+1
           * 是因为为了将newIndexToOldIndexMap默认属性值0和
           * 旧的children第一项的索引0区分开
           */
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          // 如果能找到，则需要比较两个节点的差异，再去比较它们自己的children
          patch(oldVNode, c2[newIndex], el);
        }
      }

      /**
       * 遍历新的children乱序部分
       * 将能旧的children 能复用的部分 按照新的children位置重新“排列”并插入
       * 并且还需要将新的children中“新增”child添加上
       * 注意：是从尾部开始遍历
       * [i ... e1]: a b [c d e] f g
       * [i ... e2]: a b [e d c h] f g
       * toBePatched = 4
       * currentIndex 一开始指向 h
       * anchor 一开始指向 f
       */

      // 计算出了不用动序列 （索引）
      let increasingNewIndexSequence = getSequence(
        newIndexToOldIndexMap
      );
      let j = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        // 当前要操作的child
        const currentIndex = s2 + i;
        const child = c2[currentIndex];
        // 设置锚点
        const anchor =
          currentIndex + 1 < c2.length
            ? c2[currentIndex + 1].el
            : null;

        /**
         * 判断child是要移动还是新增
         */
        if (newIndexToOldIndexMap[i] === 0) {
          // newIndexToOldIndexMap[i]为0 说明是新增的
          patch(null, child, el, anchor);
        } else {
          if (i !== increasingNewIndexSequence[j]) {
            // 通过序列来进行比对，找到哪些需要移动
            hostInsert(child.el, el, anchor);
          } else {
            j--; // 不做任何操作
          }
        }
      }
    }
  }

  /**
   * 卸载子节点的方法
   */
  function unmountChildren(children, parentComponent) {
    children.forEach(child => {
      unmount(child, parentComponent);
    });
  }

  /**
   * 更新子节点的方法
   * @param n1 旧节点
   * @param n2 新节点
   * @param el 真实的DOM节点（n2复用n1的真实DOM节点）
   * @param parentComponent 父组件
   */
  function patchChildren(n1, n2, el, anchor, parentComponent) {
    let c1 = n1.children;
    let c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      /**
       * 新子节点是文本
       * 数组 ——> 文本
       * 文本 ——> 文本
       * 空 ——> 文本
       * 若旧子节点是数组，则需先删除旧子节点，再设置文本内容
       * 不是的话，直接设置文本内容
       */
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1, parentComponent);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      // 新子节点是数组和空的情况
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧子节点是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          /**
           * 新子节点也是数组
           * 数组 ——> 数组
           * diff算法
           */
          patchKeyedChildren(c1, c2, el, parentComponent);
        } else {
          /**
           * 新子节点是空
           * 数组 ——> 空
           * 删除所有旧子节点
           */
          unmountChildren(c1, parentComponent);
        }
      } else {
        /**
         * 旧子节点是文本或空
         * 文本 ——> 数组
         * 文本 ——> 空
         * 空 ——> 数组
         * 空 ——> 空
         * 旧子节点若是文本，则清空再挂载新子节点
         * 不是则直接挂载新子节点
         */
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el, anchor, parentComponent);
        }
      }
    }
  }

  /**
   * VNode的diff更新处理
   */
  function patchElement(n1, n2, parentComponent) {
    // n1 和 n2 能复用说明dom节点就不用删除了

    // 复用真实DOM节点,不用删除
    let el = (n2.el = n1.el);

    let oldProps = n1.props;
    let newProps = n2.props;
    // 比较属性
    patchProps(oldProps, newProps, el);

    // 比较children
    patchChildren(n1, n2, el, null, parentComponent);
  }

  /**
   * 更新组件props的方法
   */
  function updateProps(instance, prevProps, nextProps) {
    for (let key in nextProps) {
      /**
       * 赋予值的时候 会重新调用update，但是会被屏蔽掉
       * 注意：这里改的属性不是通过代理对象instance.proxy修改的
       * 修改的是组件上实例上的props
       */
      instance.props[key] = nextProps[key];
    }
    for (let key in prevProps) {
      if (!(key in nextProps)) {
        delete instance.props[key];
      }
    }
  }

  /**
   * 更新组件上属性的方法
   * @param instance 组件实例
   * @param next 新的VNode
   */
  function updateComponentPreRender(instance, next) {
    instance.next = null;
    instance.vnode = next; // 更新虚拟节点和next属性
    updateProps(instance, instance.props, next.props); // 之前的props
  }

  /**
   * 组件的挂载，并对组件实例进行响应式处理
   * @param instance 组件实例
   * @param container 父容器
   * @param anchor 锚点
   */
  function setupRenderEffect(instance, container, anchor) {
    /**
     * 组件响应式变化的回调方法
     */
    const componentUpdate = () => {
      const { render } = instance;

      if (!instance.isMounted) {
        // 组件初始化挂载

        /**
         * lifeCycle hook BEFORE_MOUNT
         * 生命周期钩子，挂载前
         */
        if (instance.bm) {
          // ...
          invokerFns(instance.bm);
        }

        /**
         * 调用用户写的原始组件中的render
         * 并将其生成的VNode挂到组件实例instance.subTree上
         * 组件最终要渲染的虚拟节点 就是subtree
         *
         * 注意：响应式的依赖收集发生在这里
         * 组件实例的data在setupComponent时已经被转换成ReactiveObj
         *
         * 注意：这里render中的this指向的是组件实例上的代理对象（不是ReactiveObj）
         * 通过这个代理对象可以访问组件上的data、props、$attrs等属性
         * 同时也对用户的一些操作组件属性的行为进行拦截
         */
        const subTree = render.call(instance.proxy);

        /**
         * 真正的初始化挂载
         * 和元素类型、文本类型一样
         * 传入VNode给patch方法进行渲染
         * 注意：这里patch的是subTree不是instance
         * subTree的VNode的类型有用户编写的render决定
         */
        patch(null, subTree, container, anchor, instance);

        instance.subTree = subTree;
        instance.isMounted = true; // 标识当前组件已经挂载过了

        /**
         * lifeCycle kook MOUNTED
         * 生命周期钩子，挂载完成
         */
        if (instance.m) {
          // ...
          invokerFns(instance.m);
        }
      } else {
        // 组件更新

        let next = instance.next; // next表示新的虚拟节点

        if (next) {
          /**
           * 有next表示要更新属性
           * 注意：这里更新属性不会触发componentUpdate再次执行
           * 这是因为代码能执行到这里说明，当前组件的effect是激活的
           * 在reactivity模块做的优化逻辑中，
           * effect激活时，属性变化引起的再次激活effect会被屏蔽掉
           */
          updateComponentPreRender(instance, next);
        }

        // 生成新的VNode
        const subTree = render.call(instance.proxy);
        /**
         * 更新逻辑
         * 将新的VNode和旧的VNode传给patch方法进行更新
         */
        patch(instance.subTree, subTree, container, anchor, instance);

        // 更新subTree
        instance.subTree = subTree;

        /**
         * lifeCycle hook UPDATED
         * 生命周期钩子，更新完成
         */
        if (instance.u) {
          // ....
          invokerFns(instance.u);
        }
      }
    };

    const effect = new ReactiveEffect(componentUpdate, () =>
      queueJob(instance.update)
    );

    /**
     * 将effect的run方法绑定到组件上，
     * 后续组件更新会用到
     * 也是暴露给用户使用的强制更新组件的方法
     */
    let update = (instance.update = effect.run.bind(effect));

    // 进行挂载
    update();
  }

  /**
   * 组件类型的VNode的挂载
   * @param vnode 虚拟节点
   * @param container 父容器
   * @param anchor 锚点 用于真实节点的insert操作
   * 组件的更新流程 插槽的更新 属性更新
   */
  function mountComponent(vnode, container, anchor, parentComponent) {
    /**
     * （1）组件挂载前 需要创建一个组件的实例（对象）
     * 对象中包含了组件的状态、组件的属性、组件对应的生命周期
     * 将创建的组件实例保存到vnode上
     */
    const instance = (vnode.component =
      createComponentInstance(vnode, parentComponent));

    /**
     * (2) 处理组件的属性和组件的插槽
     * 处理属性：
     *  初始化props：
     *    用户接收的props挂到instance.props上
     *    用户未接收的props挂到instance.attrs上
     *    将instance.props处理成响应式的
     *  设置代理对象instance.proxy供用户访问:
     *    对组件实例对象进行代理，data、props、$attrs...等的get和set
     *  处理setup:
     *    给setup的两个参数props和context进行赋值，并进行传参调用
     *    根据setup的执行结果改变组件的render或setupState
     *  初始化slots：
     *    将slots挂到组件实例上instance.slots
     */
    setupComponent(instance);

    /**
     * (3）给组件绑定一个effect
     * 组件数据变化后可以重新渲染
     */
    setupRenderEffect(instance, container, anchor);
  }

  /**
   * 判断props是否发生变化
   */
  function hasChange(prevProps, nextProps) {
    for (let key in nextProps) {
      if (nextProps[key] != prevProps[key]) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断组件是否需要更新的方法
   * (1) 根据props判断
   */
  function shouldComponentUpdate(n1, n2) {
    const prevProps = n1.props;
    const nextProps = n2.props;

    return hasChange(prevProps, nextProps); // 如果属性有变化说明要更新
  }

  /**
   * 组件的更新处理方法
   * @param n1 旧的VNode
   * @param n2 新的VNode
   */
  function updateComponent(n1, n2) {
    // 复用组件实例
    const instance = (n2.component = n1.component);

    if (shouldComponentUpdate(n1, n2)) {
      /**
       * 若判断组件需要更新
       * 则将新的VNode挂在组件的next上
       * 并调用instance.update()触发组件的更新
       * instance.update()触发的effect的回调 componentUpdate
       * 注意：组件的更新是在这里触发的，使用的是reactivity模块的功能
       */
      instance.next = n2;
      instance.update();
    } else {
      instance.vnode = n2;
    }
  }

  /**
   * 文本类型的VNode的挂载和更新处理
   */
  function processText(n1, n2, container) {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateTextNode(n2.children)),
        container
      );
    } else {
      // 复用老的节点
      const el = (n2.el = n1.el);
      let newText = n2.children;
      if (newText !== n1.children) {
        // 不相同才更新
        hostSetText(el, newText);
      }
    }
  }

  /**
   * fragment类型的VNode的挂载和更新处理
   */
  function processFragment(n1, n2, container, parentComponent) {
    if (n1 == null) {
      mountChildren(n2.children, container, null, parentComponent);
    } else {
      patchKeyedChildren(
        n1.children,
        n2.children,
        container,
        parentComponent
      );
    }
  }

  /**
   * 元素类型的VNode的挂载和更新处理
   */
  function processElement(
    n1,
    n2,
    container,
    anchor,
    parentComponent
  ) {
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  }

  /**
   * 组件类型的VNode的挂载和更新处理
   */
  function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      // 初始化挂载组件
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // 组件的更新流程 插槽的更新 属性更新
      updateComponent(n1, n2);
    }
  }

  /**
   * VNode的初始化挂载和diff更新
   * @param n1 容器上保存的上一次的VNode
   * @param n2 新的VNode
   * @param container 容器 真实的DOM节点
   */
  const patch = (
    n1,
    n2,
    container,
    anchor = null,
    parentComponent = null
  ) => {
    // 若n1有值且n2、n1不相等，则说明是要将n1替换成n2
    if (n1 && !isSameVNode(n1, n2)) {
      // 卸载n1并重制为null，后续走n2的初始化
      unmount(n1, parentComponent);
      n1 = null;
    }

    /**
     * n1 如果是null 说明是初始化挂载
     * n1 如果有值 说明是更新 要走diff算法
     */
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 通过位运算判断当前VNode是元素类型
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  };

  /**
   * VNode的卸载
   */
  const unmount = (n1, parentComponent) => {
    let { shapeFlag, component } = n1;

    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      parentComponent.ctx.deactivate(n1);
    }

    if (n1.type == Fragment) {
      // fragment 删除所有子节点
      return unmountChildren(n1.children, parentComponent);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      // _vnode 组件的虚拟节点  subTree组件渲染的内容
      return unmount(component.subTree, parentComponent); // 组件要卸载的是subTree 而不是自己
    }

    hostRemove(n1.el);
  };

  /**
   * DOM的渲染方法
   * 负责DOM的初始化挂载、更新、卸载
   * @param vnode 虚拟节点
   * @param container 容器，真实的DOM节点
   */
  function render(vnode, container) {
    if (vnode == null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode, null);
      }
    } else {
      // 初始化挂载和更新
      patch(container._vnode || null, vnode, container);
    }
    // 第一次渲染的时候就将vnode保留到了容器上，用于后续区分是初始化挂载还是更新
    container._vnode = vnode;
  }

  return {
    render
  };
}
