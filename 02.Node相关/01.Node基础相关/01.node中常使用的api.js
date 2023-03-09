// 服务端全局变量原则是是global， 但是node在执行的时候为了实现模块化，会在执行代码时，外部包装一个函数，这个函数在执行的时候 会改变this指向
// console.log(this)

// console.dir(global, {showHidden: true})

// 日常使用多的全局属性
// Buffer, process,
// console.log('global.process', global.process)

// 日常使用多的全局变量, 可以直接访问，但是不能通过global来获取
//  __filename, __dirname, exports ,module ,require
// console.log(__filename, __dirname, exports ,module ,require)


/* ---------------------------------------------------------- */
// 代表文件的所在位置 是一个绝对路径
// console.log(__filename);

// 文件所在的目录  是一个绝对路径
// console.log(__dirname);

/* ---------------------------------------------------------- */

/* process 相关 */
// 所有属性
// console.log(Object.keys(process));

// platform 识别系统       windows -》 win32; mac => darwin
// console.log(process.platform)

// cwd 获取执行命令时的路径
// console.log(process.cwd())

// env 环境变量,代码执行时，电脑中的环境变量
// console.log(process.env)

// argv 执行命令时所带的参数 1.代表的是可执行node.exe 2.执行的是哪个文件
// console.log(process.argv)

/* ---------------------------------------------------------- */
// commander 命令行管家
const { program } = require('commander');
program.version('0.0.1');

program
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --small', 'small pizza size')
  .option('-p, --pizza-type <type>', 'flavour of pizza')
  .command('run').action(()=>{
      console.log('run')
  });

program.parse(process.argv); // 执行的时候通过 --version就可以得到0.0.1

const options = program.opts();
console.log(options)
