const fs = require('fs');
const path = require('path');

/*
文件读取-fs.readFile

fs.readFile(filename,[encoding],[callback(error,data)] 文件读取函数
它接收第一个必选参数 filename，表示读取的文件名。
第二个参数 encoding 是可选的，表示文件字符编码。
第三个参数callback是回调函数，用于接收文件的内容。

说明：如果不指定 encoding ，则callback就是第二个参数。
回调函数提供两个参数 err 和 data ， err 表示有没有错误发生，data 是文件内容。
如果指定 encoding ， data 是一个解析后的字符串，否则将会以 Buffer 形式表示的二进制数据。
*/

// 异步读取
const filePath = path.join(__dirname, 'test.txt');
fs.readFile(filePath, 'utf-8', (error, data) => {
  // console.warn('utf-8', data);
});

fs.readFile(filePath, (error, data) => {
  // console.warn('buffer', data);
});

// 同步读取
const result = fs.readFileSync(filePath, 'utf-8');
// console.log('result',result)

/* ---------------------------------------------------------------------- */

/*
文件写入-fs.writeFile
fs.writeFile(filename, data, [options], callback)
第一个必选参数 filename ，表示读取的文件名
第二个参数要写的数据
第三个参数 option 是一个对象，如下：
encoding {String | null} default='utf-8'
mode {Number} default=438(aka 0666 in Octal)
flag {String} default='w'
*/

fs.writeFile(filePath, '写了些数据', error => {
  if (error) console.log(error);
  const result = fs.readFileSync(filePath, 'utf-8');
  // console.log(result);
});

fs.writeFile(filePath, '追加写了些数据', { flag: 'a' }, error => {
  if (error) console.log(error);
  const result = fs.readFileSync(filePath, 'utf-8');
  // console.log(result);
});

/*
指定位置读写文件操作(高级文件操作)
接下来的高级文件操作会与上面有些不同，流程稍微复杂一些，要先用fs.open来打开文件，然后才可以用fs.read去读，或者用fs.write去写文件，最后，需要用fs.close去关掉文件
read 方法与 readFile 不同，一般针对于文件太大，无法一次性读取全部内容到缓存中或文件大小未知的情况，都是多次读取到 Buffer 中
*/

/*
文件打开-fs.open
fs.open(path, flags, [mode], callback)
第一个参数:文件路径
第二个参数:标识符 flag
第三个参数:[mode] 是文件的权限（可选参数，默认值是 0666）
第四个参数:callback 回调函数
*/

fs.open(filePath, 'r', (err, fd) => {
  // 第二个参数为一个整数，表示打开文件返回的文件描述符
  // console.log('fd', fd);
});

/*
文件读取-fs.read
fs.read(fd, buffer, offset, length, position, callback)
六个参数
fd：文件描述符，需要先使用 open 打开，使用fs.open打开成功后返回的文件描述符；
buffer：一个 Buffer 对象，v8引擎分配的一段内存，要将内容读取到的 Buffer；
offset：整数，向 Buffer 缓存区写入的初始位置，以字节为单位；
length：整数，读取文件的长度；
position：整数，读取文件初始位置；文件大小以字节为单位
callback：回调函数，有三个参数 err（错误），bytesRead（实际读取的字节数），buffer（被写入的缓存区对象），读取执行完成后执行。
*/
const buf = Buffer.alloc(40);
fs.open(filePath, 'r', (err, fd) => {
  // 读取文件
  fs.read(fd, buf, 0, 3, 0, (err, bytesRead, buffer) => {
    console.log('bytesRead', bytesRead)
    console.log('buffer.toString()', buffer.toString())

    // 继续读取
    fs.read(fd, buf, 3, 3, 3, (err, bytesRead, buffer) => {
      console.log('bytesRead', bytesRead)
      console.log('buffer.toString()', buffer.toString())
    })
  })
})

/*
文件写入-fs.write
fs.write(fd, buffer, offset, length, position, callback)
*/

// fs.open(filePath, 'w+', (err, fd) => {
//   // 读取文件
//   fs.write(fd, buf, 0, 6, 0, (err, bytesRead, buffer) => {
//     console.log('bytesRead', bytesRead)
//     console.log('buffer.toString()', buffer.toString())
//   })
// })

/*
文件关闭-fs.close
fs.close(fd, callback)
第一个参数：fd 文件open时传递的文件描述符
第二个参数 callback 回调函数,回调函数有一个参数 err（错误），关闭文件后执行
*/
// fs.open(filePath, 'r', (err, fd) => {
//   fs.close(fd, (err) => {
//     console.log('关闭成功') // 关闭成功
//   })
// })