const Promise = require('./lib/Promise');

const promise = new Promise((res, rej) => {
  const num = Math.ceil(Math.random() * 10);
  if (num > 5) {
    res(num);
  } else {
    rej(num);
  }
});

promise.then(
  value => {
    console.log('then1成功回调', value);
  },
  reason => {
    console.log('then1失败回调', reason);
  }
);

promise.then(
  value => {
    console.log('then2成功回调', value);
  },
  reason => {
    console.log('then2失败回调', reason);
  }
);

promise
  .then(
    value => {
      console.log('then3成功回调', value);
      if (value > 6) {
        return new Promise((res, rej) => {
          if (value > 7) {
            res('then3成功回调的返回值是promise');
          }
          rej('then3成功回调的返回值是promise');
        });
      }
      return value;
    },
    reason => {
      console.log('then3失败回调', reason);
    }
  )
  .then(
    value => {
      console.log('链式调用成功回调', value);
    },
    reason => {
      console.log('链式调用失败回调', reason);
    }
  );

promise.finally(data => {
  console.log('无论成功还是失败', data);
});
