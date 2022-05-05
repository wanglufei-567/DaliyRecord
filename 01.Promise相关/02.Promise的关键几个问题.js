/*
  1. 如何改变promise的状态?
    (1)resolve(value): 如果当前是pendding就会变为resolved
    (2)reject(reason): 如果当前是pendding就会变为rejected
    (3)抛出异常: 如果当前是pendding就会变为rejected
*/
const promise1 = new Promise(() => {
  // throw 123
});
// console.log('promise1', promise1);

/* ------------------------------------------------------------ */

/*
  2.一个promise指定多个成功/失败回调函数, 都会调用吗?
    当promise改变为对应状态时都会调用，并且入参是相同的
*/

const promise2 = new Promise(res => {
  res({ a: 123 });
});

promise2.then(result => {
  // console.log('第一个回调', result);
  result.a = 124;
});

promise2.then(result => {
  // console.log('第二个回调', result);
});

/* ------------------------------------------------------------ */

/*
  3.改变promise状态和指定回调函数谁先谁后?
    (1)都有可能, 正常情况下是先指定回调再改变状态, 但也可以先改状态再指定回调
    (2)如何先改状态再指定回调?
      ①在执行器中直接调用resolve()/reject()
      ②延迟更长时间才调用then()
    (3)什么时候才能得到数据?
      ①如果先指定的回调, 那当状态发生改变时, 回调函数就会调用, 得到数据
      ②如果先改变的状态, 那当指定回调时, 回调函数就会调用, 得到数据
*/

/* ------------------------------------------------------------ */

/*
  4.promise.then()返回的新promise的结果状态由什么决定?
  (1)简单表达: 由then()指定的回调函数执行的结果决定
  (2)详细表达:
      ①如果抛出异常, 新promise变为rejected, reason为抛出的异常
      ②如果返回的是非promise的任意值, 新promise变为resolved, value为返回的值
      ③如果返回的是另一个新promise, 此promise的结果就会成为新promise的结果
*/

/* ------------------------------------------------------------ */

/*
  6.promise异常传/穿透?
    (1)当使用promise的then链式调用时, 可以在最后指定失败的回调,
    (2)前面任何操作出了异常, 都会传到最后失败的回调中处理
  7.中断promise链?
    (1)当使用promise的then链式调用时, 在中间中断, 不再调用后面的回调函数
    (2)办法: 在回调函数中返回一个pendding状态的promise对象
*/
