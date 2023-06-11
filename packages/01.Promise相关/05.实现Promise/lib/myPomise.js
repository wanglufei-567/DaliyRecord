const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    const self = this;
    self.status = PENDING;
    self.data = null;
    self.callback = [];

    function resolve(value) {
      if (self.status !== PENDING) return;
      self.status = RESOLVED;
      self.data = value;

      if (self.callback.length > 0) {
        self.callback.forEach(item => {
          setTimeout(() => {
            item.onResolved(value);
          });
        });
      }
    }

    function reject(reason) {
      if (self.status !== PENDING) return;
      self.status = REJECTED;
      self.data = reason;

      if (self.callback.length > 0) {
        self.callback.forEach(item => {
          setTimeout(() => {
            item.onRejected(reason);
          });
        });
      }
    }

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onResolved, onRejected) {
    const self = this;
    onResolved =
      typeof onResolved === 'function' ? onResolved : value => value;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason;
          };

    return new MyPromise((res, rej) => {
      function handler(callback) {
        try {
          const result = callback(self.data);
          if (result instanceof MyPromise) {
            result.then(res, rej);
          } else {
            res(result);
          }
        } catch (err) {
          rej(err);
        }
      }

      if (self.status === RESOLVED) {
        setTimeout(() => {
          handler(onResolved);
        });
      } else if (self.status === REJECTED) {
        setTimeout(() => {
          handler(onRejected);
        });
      } else {
        self.callback.push({
          onResolved() {
            handler(onResolved);
          },
          onRejected() {
            handler(onRejected);
          }
        });
      }
    });
  }

  catch(onRejected) {
    return this.then(_, onRejected);
  }

  static resolve(value) {
    return new MyPromise((res, rej) => {
      if (value instanceof MyPromise) {
        value.then(res, rej);
      } else {
        res(value);
      }
    });
  }

  static reject(reason) {
    return new MyPromise((res, rej) => {
      rej(reason);
    });
  }

  static all(tasks) {
    let count = 0;
    const resultArr = Array(tasks.length);

    return new MyPromise((res, rej) => {
      tasks.forEach((item, key) => {
        MyPromise.resolve(item).then(
          value => {
            resultArr[key] = value;
            count++;
            if (count === tasks.length) {
              res(resultArr);
            }
          },
          reason => {
            rej(reason);
          }
        );
      });
    });
  }

  static race(tasks) {
    return new MyPromise((res, rej) => {
      tasks.forEach((item, key) => {
        MyPromise.resolve(item).then(
          value => {
            res(value);
          },
          reason => {
            rej(reason);
          }
        );
      });
    });
  }
}
