const Compiler = require('./Compiler');

/**
 * @description webpack方法
 * @params options 配置文件中的配置信息
 */
function webpack(options) {
  // 1.初始化参数：从配置文件和 Shell 语句中读取并合并参数,得出最终的配置对象

  //argv[0]是Node程序的绝对路径 argv[1] 正在运行的脚本
  const argv = process.argv.slice(2);
  const shellOptions = argv.reduce((shellOptions, options) => {
    // options = '--mode=development'
    const [key, value] = options.split('=');
    shellOptions[key.slice(2)] = value;
    return shellOptions;
  }, {});
  const finalOptions = { ...options, ...shellOptions };
  console.log('finalOptions', finalOptions)

  //2.用上一步得到的参数初始化 `Compiler` 对象
  const compiler = new Compiler(finalOptions);

  // //3.加载所有配置的插件
  const { plugins } = finalOptions;
  for (let plugin of plugins) {
    plugin.apply(compiler);
  }

  return compiler;
}

module.exports = webpack;
