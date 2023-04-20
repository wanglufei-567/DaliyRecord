/**
若想实现并发其实很简单，直接遍历循环任务队列，将若有任务拿出来执行便可；
但若想控制最大并发数，事情就变得复杂起来了；

假设我们存在一个*==任务执行池==*，这个池子中最多只能有最大并发数 **X**个任务在执行，并且当池子中有一个任务执行完了，才能从任务队列中取出新的任务进池子中执行；

所以，解决思路就是实现这么个*==任务执行池==*，这个任务执行池需要满足以下条件：

- 池子中最多只能有最大并发数**X**个任务
- 一个任务执行完成之后，再去从任务队列中取出任务
- 当所有的任务都执行完成之后，才算真正结束执行
 */
function limitConcurrency(tasks, limit) {
  const resultArr = Array(tasks.length);
  let total = limit;
  let count = 0;

  return new Promise(res => {
    /**
     * 根据limit循环n次
     * 每循环一次相当于创建一个任务执行线
     * 每一个任务执行线，都会从任务队列中取出任务来执行
     */
    while (limit > 0) {
      start();
      limit--;
    }

    async function start() {
      const index = resultArr.length - tasks.length;
      const task = tasks.shift();
      try {
        const result = await task();
        resultArr[index] = result;
      } catch (err) {
        resultArr[index] = err;
      }
      /**
       * 每次任务执行完之后
       * 都要判断任务队列中是否还有任务，
       * 若队列中还有任务，则继续取任务出来执行
       * 若队列中没有任务了，则还需要确保所有任务执行线上的任务都执行完了
       */
      if (tasks.length === 0) {
        console.log('任务队列中没有任务了');
        count++;
        if (count === total) {
          console.log('所有任务都执行完了');
          res(resultArr);
        }
      } else {
        start();
      }
    }
  });
}

const p1 = () => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      console.log('p1');
      res('p1');
    }, 3000);
  });
};

const p2 = () => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      console.log('p2');
      rej('p2');
    }, 1000);
  });
};

const p3 = () => {
  console.log('p3');
  return 'p3';
};

const p4 = () => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      console.log('p4');
      res('p4');
    }, 3000);
  });
};

async function fn() {
  const result = await limitConcurrency([p1, p2, p3, p4], 2);
  console.log('result', result);
}

fn();
