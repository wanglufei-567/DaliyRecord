/* 原理就是
1.读取文件
2. 包装函数 ，设置参数
3，默认返回module.exports 对象
*/
const path = require('path');
const fs = require('fs');
const vm = require('vm');

function Module(id) {
  this.id = id; // 绝对路径
  this.exports = {}; // 模块对应的导出结果
}

Module._extensions = {
  // js模块的处理
  '.js'(module) {
    // 读取文件内容
    let script = fs.readFileSync(module.id, 'utf8');
    // 生成包装函数的模版
    let template = `(function(exports,module,require,__filename,__dirname){${script}})`;
    // 生成包装函数
    let compileFunction = vm.runInThisContext(template);

    let exports = module.exports; // 为了实现一个简写
    let thisValue = exports; //  this = exports = module.exports = {}
    let filename = module.id;
    let dirname = path.dirname(filename);

    compileFunction.call(
      thisValue,
      exports,
      module,
      myRequire,
      filename,
      dirname
    );
  },
  // json模块的处理
  '.json'(module) {
    let script = fs.readFileSync(module.id, 'utf8');
    module.exports = JSON.parse(script); // 直接将json挂载到exports 对象上，这样用户可以直接require一个json文件，拿到的就是json的内容
  }
};

Module._resolveFilename = function (filename) {
  // 生成绝对路径
  const filePath = path.resolve(__dirname, filename);
  // 判断文件是否存在
  let exists = fs.existsSync(filePath);
  if (exists) return filePath;
  // 加上文件后缀再一次判断
  let keys = Reflect.ownKeys(Module._extensions);
  for (let i = 0; i < keys.length; i++) {
    let newPath = filePath + keys[i];
    if (fs.existsSync(newPath)) return newPath;
  }
  throw new Error('module not found');
};

Module._cache = {}; // 用来做缓存的

Module.prototype.load = function () {
  let extension = path.extname(this.id); // 要加载的文件名
  // 不同类型的文件有不同的处理方式
  Module._extensions[extension] && Module._extensions[extension](this);
};

function myRequire(filename) {
  // 解析文件路径
  let filePath = Module._resolveFilename(filename);
  // 判断是否有缓存
  let exists = Module._cache[filePath];
  if (exists) {
    return exists.exports;
  }
  // 无缓存的话创造一个模块
  let module = new Module(filePath);
  // 缓存模块
  Module._cache[filePath] = module;
  // 获取模块中的内容，包装函数，让函数执行，用户的逻辑会给module.exports 赋值
  module.load();
  return module.exports; // 最后的结果
}