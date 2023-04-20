/*
函数防抖(debounce)：触发高频事件后n秒内函数只会执行一次，如果n秒内高频事件再次被触发，则重新计算时间。
 */

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 测试
function task() {
  console.log('run task');
}
const debounceTask = debounce(task, 1000);
// debounceTask()

/*
函数节流(throttle)：高频事件触发，但在n秒内只会执行一次，所以节流会稀释函数的执行频率。
 */

function throttle(fn, delay) {
  let last = 0; // 上次触发时间
  return function (...args) {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// 测试
function task() {
  console.log('run task');
}
const throttleTask = throttle(task, 1000);
