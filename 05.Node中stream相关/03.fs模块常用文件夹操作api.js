const fs = require('fs');

/*
fs.mkdir 创建目录
fs.mkdir(path, [options], callback)
第一个参数：path 目录路径
第二个参数[options]，
recursive <boolean> 默认值: false。
mode <integer> Windows 上不支持。默认值: 0o777。
可选的 options 参数可以是指定模式（权限和粘滞位）的整数，也可以是具有 mode 属性和 recursive 属性（指示是否应创建父文件夹）的对象。
第三个参数回调函数,回调函数有一个参数 err（错误），关闭文件后执行.
*/

// fs.mkdir('./test', (err)=>{
// console.log(err)
// })

/*
fs.rmdir 删除目录
fs.rmdir(path, callback)
第一个参数：path 目录路径
第三个参数回调函数,回调函数有一个参数 err（错误），关闭文件后执行
*/

fs.rmdir('./test', function(err) {
  if (err) return
  console.log('删除目录成功')
})


/*
fs.readdir 读取目录
第一个参数：path 目录路径
第二个参数[options]可选的
options 参数可以是指定编码的字符串，也可以是具有 encoding 属性的对象，该属性指定用于传给回调的文件名的字符编码。
如果 encoding 设置为 'buffer'，则返回的文件名是 Buffer 对象。
如果 options.withFileTypes 设置为 true，则 files 数组将包含 fs.Dirent 对象。
第三个参数回调函数,回调函数有两个参数，第一个 err（错误），第二个返回 的 data 为一个数组，包含该文件夹的所有文件，是目录中的文件名的数组（不包括 '.' 和 '..'）
*/

fs.readdir('./test',function(err,data){
  if(err) return;
  //data为一个数组
  console.log('读取的数据为：'+data[0]);
});