const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'test.txt');
const filePath2 = path.join(__dirname, 'test2.txt');
let buf = Buffer.alloc(100);

/* 如果是一个大文件几百M 一次性读取写入不现实，所以需要多次读取多次写入
大文件读写，就是采用流的方式，读一点到缓存区再从缓存区中拿出数据写入到新文件中
*/

fs.open(filePath, 'r', function (err, fd) {
  fs.open(filePath2, 'w+', function (err, wfd) {
    let read = 0; // 下次读取文件的位置
    let write = 0; // 下次写入文件的位置

    function close() {
      fs.close(fd, () => {});
      fs.close(wfd, () => {});
    }

    function next() {
      fs.read(fd, buf, 0, 3, read, function (err, bytesRead) {
        read += bytesRead;

        if (!bytesRead) {
          return close();
        }

        fs.write(wfd, buf, 0, 3, write, function (err, bytesWritten) {
          write += bytesWritten
          next();
        });
      });
    }
    next();
  });
});
