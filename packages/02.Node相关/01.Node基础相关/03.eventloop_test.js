console.log('1');
process.nextTick(function () {
  console.log('2');
});
setTimeout(() => {
  console.log('3');
}, 0);
async function async1() {
  console.log('4');
  const res = await async2();
  console.log(res)
  console.log('5');
}
async function async2() {
  console.log('6');
  return Promise.resolve('10')
}
async1();
new Promise(function (resolve) {
  console.log('7');
  resolve();
}).then(function () {
  console.log('8');
});
console.log('9');
// 1、4、6、7、9、2、8、10、5、3