
class RunPlugin{
  apply(compiler) {
    //在此插件里可以监听run这个钩子
    compiler.hooks.run.tap('RunPlugin', () => {
      console.log('run1:开始编译');
    });
  }
}
module.exports = RunPlugin