
class RunPlugin{
  apply(compiler) {
    compiler.hooks.run.tap('RunPlugin', () => {
      console.log('run2:开始编译');
    });
  }
}
module.exports = RunPlugin