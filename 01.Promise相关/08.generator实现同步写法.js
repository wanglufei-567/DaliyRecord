const fs = require('fs/promises');
const path = require('path');

const readA = () =>
  fs.readFile(path.resolve(__dirname, 'a.txt'), 'utf8');

const readB = data1 =>
  fs.readFile(path.resolve(__dirname, data1), 'utf8');

/**
 * 链式操作
 */
readA()
  .then(data => {
    console.log('ReadA', data);
    return readB(data);
  })
  .then(data => console.log('readB', data));


/**
 * 使用Generator的写法
 */
function* readFile() {
  let data1 = yield readA();
  let data2 = yield readB(data1);
  return data2; // 30
}

let it = readFile();
let {value,done} = it.next();
value.then(data1=>{
    let {value,done} = it.next(data1)
    value.then(data2=>{
        let {value,done} = it.next(data2);
        console.log(value)
    })
})

/**
 * 将next的执行封装成递归方法co
 * 使用co + Generator的写法
 */
function co(it) {
  return new Promise((resolve, reject) => {
    function step(data) {
      let { value, done } = it.next(data);
      if (!done) {
        Promise.resolve(value)
          .then(data => {
            // 第一步完成
            step(data); // 下一步
          })
          .catch(e => {
            reject(e);
          });
      } else {
        resolve(value);
      }
    }
    step();
  });
}

co(readFile())
  .then(data => {
    console.log(data);
  })
  .catch(e => {
    console.log(e);
  });
