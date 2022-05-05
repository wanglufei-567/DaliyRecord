const fs = require('fs');
const path = require('path');

const filePath1 = path.join(__dirname, 'test.txt');
const filePath2 = path.join(__dirname, 'test2.txt');
const rs = fs.createReadStream(filePath1);
const ws = fs.createWriteStream(filePath2);

// 这个方法是异步的， 会读取一点写一点， 可以支持大文件的操作
rs.pipe(ws);