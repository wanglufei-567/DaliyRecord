/* fs模块 */
const fs = require('fs');
const exists = fs.existsSync('./0.note.md'); // 判断文件是否存在
console.log(exists);

let data = fs.readFileSync('./0.note.md','utf8'); // 同步读取会阻塞
console.log(data)

fs.readFile('./0.note.md', 'utf8', (err, data) => {
  console.log('readFileSync1', err, data);
});

fs.readFile('./none.md', 'utf8', (err, data) => {
  console.log('readFileSync2', err, data);
});
