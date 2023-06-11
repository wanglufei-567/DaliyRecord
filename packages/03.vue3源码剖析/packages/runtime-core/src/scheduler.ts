const queue = []; // 组件更新方法的队列，一个组件只能存一个更新方法

let isFlushing = false; // 标识是否已经有批量更新的微任务存在了

const resolvePromise = Promise.resolve();
/**
 * 批量处理组件更新的逻辑
 * @param job 组件的更新方法
 * 类似于浏览器的事件环，将任务放到队列中，去重, 异步调用任务
 */
export function queueJob(job) {
  /**
   * 去重处理
   * 函数也可以去重
   */
  if (!queue.includes(job)) {
    queue.push(job);
  }

  /**
   * 一次只开启一个批处理微任务
   * 当前微任务开始执行后才允许，开启下一个批处理微任务
   */
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;

      // 复制任务队列，将原始任务队列清空
      let copyQueue = queue.slice(0);
      queue.length = 0;

      // 将任务队列中的组件更新方法一一拿出来执行
      for (let i = 0; i < copyQueue.length; i++) {
        let job = copyQueue[i];
        job();
      }
      copyQueue.length = 0;
    });
  }
}
