const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    const self = this;
    self.status = PENDING; // 每个Promise对象的初始状态都是'pending'
    self.data = undefined; // 给promise对象制定一个用于存储结果数据的属性
    self.callbacks = []; // 回调函数存储的队列，数据结构：{onResolved(){}, onRejected(){}}

    function resolve(value) {
      if (self.status !== PENDING) return;

      self.status = RESOLVED;
      self.data = value;
      if (self.callbacks.length > 0) {
        // 用setTimeout模仿，then()中的回调放进微任务队列
        setTimeout(() => {
          self.callbacks.forEach(element => {
            element.onResolved(value);
          });
        });
      }
    }

    function reject(reason) {
      if (self.status !== PENDING) return;

      self.status = REJECTED;
      self.data = reason;
      if (self.callbacks.length > 0) {
        // 用setTimeout模仿，then()中的回调放进微任务队列
        setTimeout(() => {
          self.callbacks.forEach(element => {
            element.onRejected(reason);
          });
        });
      }
    }

    try {
      executor(resolve, reject);
    } catch (reason) {
      reject(reason);
    }
  }

  /* Promise原型上的then()方法，用于指定成功和失败的回调，返回一个新的promise对象
  返回的promise对象的状态由onResolved/onRejected执行的结果决定
  */
  then(onResolved, onRejected) {
    const self = this;

    // 给指定的回调设置默认值
    onResolved = typeof onResolved === 'function' ? onResolved : value => value;

    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason;
          };

    return new MyPromise((resolve, reject) => {
      /* 执行指定的回调函数，并根据回调函数的执行结果改变返回出去的promise的状态和数据 */

      function handle(callback) {
        try {
          const result = callback(self.data);

          // 若回调的执行结果是promise对象，则用该执行结果的状态作为返回出去的promise的状态
          if (result instanceof MyPromise) {
            result.then(resolve, reject);
          } else {
            // 执行结果不是promise对象，则返回出去的promise就是resolved状态的，参数就是执行结果
            resolve(result);
          }
        } catch (reason) {
          // 执行错误异常，则返回出去的promise是rejected状态的，参数就是异常值
          reject(reason);
        }
      }

      if (self.status === RESOLVED) {
        // 若当前promise状态为resolved则立即异步执行成功的回调函数
        setTimeout(() => {
          handle(onResolved);
        });
      } else if (self.status === REJECTED) {
        // 若当前promise状态为rejected则立即异步执行失败的回调函数
        setTimeout(() => {
          handle(onRejected);
        });
      } else {
        // 若当前promise状态为pending则将成功和失败的回调放进callbacks队列中存储起来
        self.callbacks.push({
          onResolved(value) {
            handle(onResolved);
          },
          onRejected(reason) {
            handle(onRejected);
          }
        });
      }
    });
  }

  /* 链式调用时的异常穿透，由于then()中，给onRejected设置了默认值，所以可以一路throw(reason)到catch()中，最后返回一个rejected状态的promise */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  /* 自定义实现一个finally方法，无论失败还是成功都会调用 */
  finally(callback){
    return this.then(callback, callback);
  }

  /* Promise构造函数上的静态属性，用于返回一个resolved状态的promise */
  static resolve(value) {
    return new MyPromise((resolve, reject) => {
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
      } else {
        resolve(value);
      }
    });
  }

  /* Promise构造函数上的静态属性，用于返回一个resolved状态的promise */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static all(promises) {
    const values = new Array(promises.length);
    let count = 0;

    return new MyPromise((resolve, reject) => {
      promises.forEach((item, key) => {
        MyPromise.resolve(item).then(
          value => {
            count += count;
            values[key] = value;
            // 全部执行完改变状态为resolved
            if (count === promises.length) {
              resolve(values);
            }
          },
          reason => {
            // 只要有一个promise调用失败回调了，返回出去的promise的状态就改变为rejected
            reject(reason);
          }
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(item => {
        MyPromise.resolve(item).then(
          value => {
            // 遍历执行时有一个promise调用成功回调了，返回出去的promise的状态就改变为resolved
            resolve(value);
          },
          reason => {
            // 只要有一个promise调用失败回调了，返回出去的promise的状态就改变为rejected
            reject(reason);
          }
        );
      });
    });
  }
}

module.exports = MyPromise;
