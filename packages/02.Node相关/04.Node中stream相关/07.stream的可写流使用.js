const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'test.txt');
const ws = fs.createWriteStream(filePath, {
  flags: 'w',
  encoding: 'utf-8',
  mode: 0o666,
  autoClose: true,
  emitClose: true,
  start: 0,
  highWaterMark: 3 // 水位线，当正在写入的字节小于这个数，ws.write()回返回true
});

let flg = ws.write('可', () => {
  console.log('写的是可');
});

// flg = ws.write('写', () => {
//   console.log('写的是写');
// });

console.log(flg);

ws.once('drain', ()=> {
  console.log('之前的写入完毕，下降到水位线了')
  ws.write('流')
})

// ws.end('这里可以标记末尾')

ws.on('finish', () => {
console.log('finish')
})
