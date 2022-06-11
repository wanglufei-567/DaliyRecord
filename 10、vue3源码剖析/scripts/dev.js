const { build } = require('esbuild');
const { resolve } = require('path');
const args = require('minimist')(process.argv.slice(2));

// 获取命令行参数
const target = args._[0] || 'reactivity';
const format = args.f || args.format || 'global';

// 获取待打包的包入口文件
const entry = resolve(
  __dirname,
  `../packages/${target}/src/index.ts`
);
// 获取待打包的package.json
const pkg = require(resolve(
  __dirname,
  `../packages/${target}/package.json`
));

// 输出的格式
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm';

// 输出的文件
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);

build({
  entryPoints: [entry],
  outfile,
  bundle: true, // 将所有的包打包到一起，包括第三方包
  sourcemap: true, // 方便调试
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === 'cjs' ? 'node' : 'browser',
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) console.log(`rebuilt~~~~`);
    }
  }
}).then(() => {
  console.log('watching~~~');
});
