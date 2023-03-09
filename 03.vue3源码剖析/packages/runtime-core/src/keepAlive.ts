import { onMounted, onUpdated } from './apiLifeCycle';
import { getCurrentInstance } from './component';
import { ShapeFlags } from './createVNode';

/**
 * 判断是否是KeepAlive组件的方法
 */
export const isKeepAlive = (vnode): boolean =>
  vnode.type.__isKeepAlive;


/**
 * 组件keep-alive标记的重置方法
 */
function resetFlag(vnode) {
  if (vnode.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    vnode.shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
  }
  if (vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    vnode.shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  }
}

export const KeepAlive = {
  __isKeepAlive: true, // 自定义用来标识keep-alive组件
  props: {
    max: {}
  },
  setup(props, { slots }) {
    /**
     * dom操作api都在instance.ctx.renderer上面
     * createElement创建元素
     * move 节点移动
     * unmount 节点卸载
     */
    const instance = getCurrentInstance();
    const sharedContext = instance.ctx;
    const {
      renderer: {
        m: move,
        um: unmount,
        o: { createElement }
      }
    } = sharedContext;

    /**
     * 用来缓存那些已经挂载过的但当前不显示的组件（缓存的是真实节点）
     * 避免重复渲染，后续切换的时候直接从缓存中取真实节点挂载即可
     */
    let storageContainer = createElement('div');

    const keys = new Set(); // 缓存组件的key
    const cache = new Map(); // 缓存key和组件的映射关系

    /**
     * pendingCacheKey存储当前keepAlive组件的插槽组件的key
     * 这个key是插槽组件本身或者是组件属性上的key
     * 当keepAlive组件挂载完成之后或者更新之后
     * （注意：是在挂载和更新之后，这就是为什么要用pendingCacheKey变量存储可以的原因）
     * 将插槽组件的key和插槽组件(slots.default()的返回值，是个Vnode缓存起来
     * 后续keepAlive组件要切换之前已经挂载过的插槽组件时
     * 就直接从缓存中取出这个插槽组件，进行DOM移动操作
     */
    let pendingCacheKey = null;

    /**
     * 缓存插槽组件Vnode的方法
     * 注意：instance是当前keepAlive组件
     * instance.subTree是keepAlive组件render方法生成的VNode
     * 也就是slots.default()的VNode，插槽组件的VNode
     */
    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree);
    };

    /**
     * keepAlive组件挂载完成时
     * 执行缓存插槽的逻辑
     */
    onMounted(cacheSubTree);

    /**
     * keepAlive组件更新完成时
     * 执行缓存插槽的逻辑
     */
    onUpdated(cacheSubTree);

    /**
     * keepAlive组件的插槽组件的激活方法
     * @param n2 新的插槽组件的VNode（要被挂载的，已经缓存过了的）
     * @param container 父容器（真实的DOM节点）
     * @param anchor 锚点
     */
    instance.ctx.active = (n2, container, anchor) => {
      move(n2, container, anchor);
    };

    /**
     * keepAlive组件的插槽失活方法
     * 组件卸载的时候 会将虚拟节点对应的真实节点，移动到容器中
     * @param n1 旧的插槽组件的VNode（要被移除的）
     * @param storageContainer 缓存容器（真实的DOM节点，KeepAlive创建的div）
     */
    instance.ctx.deactivate = n1 => {
      move(n1, storageContainer);
    };

    /**
     * 当缓存容器中数量大于用户配置的最大缓存数量后
     * 调用此方法清除缓存
     */
    const pruneCacheEntry = vnode => {
      const subTree = cache.get(vnode);
      resetFlag(subTree); // 移除keep-alive标记
      unmount(subTree);
      cache.delete(vnode);
      keys.delete(vnode);
    };

    return () => {
      /**
       * KeepAlive组件要render的其实是default插槽组件
       * 若是插槽不是组件的就不会走缓存，直接返回插槽的VNode
       */
      let vnode = slots.default();
      if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode;
      }

      /**
       * 处理pendingCacheKey
       * 保存当前插槽组件的key
       * 组件属性上有key就直接使用，没有就用组件本身
       */
      let comp = vnode.type;
      let key = vnode.key == null ? comp : vnode.key;
      pendingCacheKey = key;

      let cacheVnode = cache.get(key);
      if (cacheVnode) {
        /**
         * 若是缓存中有当前的插槽组件
         * 则直接复用组件实例
         * 同时标记当前插槽组件是COMPONENT_KEPT_ALIVE
         * 后续挂载时（processComponent）就不会走组件的初始化挂载逻辑
         * 直接走instance.ctx.active 插槽组件的激活逻辑
         * 从缓存容器中直接移动当前插槽组件对应的真实节点到container上
         */
        vnode.component = cacheVnode.component;
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
      } else {
        /**
         * 若是缓存中没有当前的插槽组件
         * 则存储插槽组件的key
         * 若缓存数量大于用户配置
         * 则走清除缓存逻辑
         */
        keys.add(key);
        let { max } = props;
        if (max && keys.size > max) {
          //清除第一个元素， next 返回的是一个对象 {value,done}
          pruneCacheEntry(keys.values().next().value);
        }
      }

      /**
       * 给当前插槽组件标记COMPONENT_SHOULD_KEEP_ALIVE
       * 后续插槽切换时，在unmount逻辑中，不会真的卸载当前插槽组件
       * 而是走instance.ctx.deactivate 插槽组件的失活逻辑
       * 将当前插槽组件对应的真实节点移动到缓存容器中
       */
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    };
  }
};
