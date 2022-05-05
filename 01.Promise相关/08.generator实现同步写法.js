const p1 = new Promise(res => {
  setTimeout(() => {
    res('p1');
  });
});

const p2 = data =>
  new Promise(res => {
    setTimeout(() => {
      res(data);
    });
  });

function* gen() {
  const data = yield p1;
  const result = yield p2(data);
  return result;
}

const it = gen();

// 原理
let { value } = it.next();
value.then(data => {
  let { value } = it.next(data);
  value.then(result => {
    it.next(result);
  });
});

// 封装一下
function co(it) {
  return new Promise((resolve, reject) => {
      function next(data) {
          let { value, done } = it.next(data);
          if (done) {
              return resolve(value);
          }
          Promise.resolve(value).then(data => {
              next(data)
          }, reject)
      }
      next();
  })
}

co(gen()).then(result => {
  console.log(result)
})

// async ...await 其实就是co + generator
