let path = require('path'); // 路径处理模块

console.log(path.join(__dirname,'a','//b','c','..'))
console.log(path.resolve('a','b','c','..')); // 他也具备拼接的功能，但是最终出来的结果是一个绝对路径,path.resolve 遇到/ 表示的是根路径， 默认以当前路径（process.cwd()）解析成绝对路径

// 主要看有没有 / 其他情况下用谁都写
console.log(path.basename('a.js','.js')); // 用路径做减法
console.log(path.extname('a.js')); //.js 取最后一个后缀名作为结果
console.log(path.relative('a/c','c')); // 获取当前的相对路径
console.log(path.dirname(__filename)); // === __dirname 内部__dirname就是这样产生的
