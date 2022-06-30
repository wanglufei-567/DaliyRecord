import { ref } from '@vue/reactivity';
import { Fragment } from './createVNode';
import { h } from './h';

/**
 * 创建异步组件的方法
 * defineAsyncComponent是一个高阶组件，返回值是一个组件
 * 此组件会根据状态来决定渲染的内容，
 * 加载成功后渲染组件，
 * 在未渲染成功时渲染一个占位符节点，
 * 另外还有错误提示组件和loading组件
 */
export function defineAsyncComponent(loaderOptions) {
  /**
   * 若是入参是一个函数
   * 则默认为loaderOptions.loader
   */
  if (typeof loaderOptions == 'function') {
    loaderOptions = {
      loader: loaderOptions
    };
  }

  // 要加载的组件，默认值为null
  let Component = null;

  return {
    setup() {
      const {
        loader, // 工厂函数，返回值是promise（异步加载组件的方法）
        timeout, // 超时时间，若超时则渲染错误提示组件，不设置则永不超时
        errorComponent, // 错误提示组件
        delay, // 在显示 loadingComponent 之前的延迟
        loadingComponent, // 加载异步组件时使用的组件
        onError // 加载失败的回调，参数 err：错误信息；retry：重新加载方法；fail：结束加载
      } = loaderOptions;

      const loaded = ref(false); // 表示是否加载成功，默认值false
      const error = ref(false); // 表示是否加载失败，默认值false
      const loading = ref(false); // 表示是否正在加载中，默认值false

      /**
       * 超时处理
       * 超时直接将状态置为加载失败
       */
      if (timeout != null) {
        setTimeout(() => {
          error.value = true;
        }, timeout);
      }

      /**
       * 延迟处理
       * 有延迟值则延迟时间之后再显示loading
       * 没有延迟值则直接显示loading
       */
      if (delay) {
        setTimeout(() => {
          loading.value = true;
        }, delay);
      } else {
        loading.value = true;
      }

      /**
       * 通过promise链来实现充实加载
       */
      function load() {
        return loader().catch(err => {
          /**
           * 加载失败时
           * 若是有失败回调
           * 则返回一个Promise
           * 这个promise的状态变化之后
           * 后续的链式操作才会进行
           */
          if (onError) {
            return new Promise((resolve, reject) => {
              // 重试方法
              const retry = () => resolve(load());
              const fail = () => reject();
              onError(err, retry, fail);
            });
          } else {
            throw err;
          }
        });
      }

      load()
        .then(v => {
          loaded.value = true;
          Component = v;
        })
        .catch(err => {
          error.value = true;
        })
        .finally(() => {
          loading.value = false;
        });

      /**
       * setup中返回一个函数，说明就是render
       * render返回值是VNode
       */
      return () => {
        if (loaded.value) {
          /**
           * 只要loaded.value === true 就说明异步组件加载成功
           * 直接渲染异步组件
           * 不走下面的逻辑了
           */
          return h(Component);
        } else if (error.value && errorComponent) {
          return h(errorComponent);
        } else if (loading.value && loadingComponent) {
          return h(loadingComponent);
        } else {
          // 默认渲染一个Fragment
          return h(Fragment, []);
        }
      };
    }
  };
}
