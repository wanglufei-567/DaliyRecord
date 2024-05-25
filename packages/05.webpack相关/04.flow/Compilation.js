const path = require('path');
const fs = require('fs');
const parser = require('@babel/parser');
const types = require('@babel/types');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

//处理baseDir，将'\'替换成'/'
const baseDir = normalizePath(process.cwd());
function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

class Compilation {
  constructor(options, compiler) {
    this.options = options;
    this.compiler = compiler;
    this.modules = []; // 这里放置本次编译涉及的所有的依赖模块
    this.chunks = []; // 本次编译所组装出的代码块
    this.assets = {}; // key是文件名,值是文件内容
    this.files = []; // 代表本次打包出来的文件
    this.fileDependencies = new Set(); // 本次编译依赖的文件或者说模块
  }

  build(callback) {
    //5.根据配置中的entry找出入口文件
    let entry = {};
    if (typeof this.options.entry === 'string') {
      entry.main = this.options.entry;
    } else {
      entry = this.options.entry;
    }

    // 遍历所有的入口文件
    for (let entryName in entry) {
      //处理入口文件的文件路径
      let entryFilePath = path.posix.join(baseDir, entry[entryName]);

      // 将入口文件的路径添加进维护所有依赖模块的 Set 中
      this.fileDependencies.add(entryFilePath);

      //6.从入口文件出发,调用所有配置的Loader对模块进行编译
      // 得到入口文件对应的模块
      let entryModule = this.buildModule(entryName, entryFilePath);

      //8.根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk
      // 有几个入口，就有几个chunk
      let chunk = {
        name: entryName,
        entryModule,
        modules: this.modules.filter(module =>
          module.names.includes(entryName)
        )
      };
      this.chunks.push(chunk);
    }

    //9.再把每个 Chunk 转换成一个单独的文件加入到输出列表
    this.chunks.forEach(chunk => {
      const filename = this.options.output.filename.replace(
        '[name]',
        chunk.name
      );
      // files 本次打包出来的文件
      this.files.push(filename);

      // assets key是文件名,值是文件内容
      this.assets[filename] = getSource(chunk);
    });

    // 执行compiler对象中的onCompiled方法
    callback(
      null,
      {
        modules: this.modules,
        chunks: this.chunks,
        assets: this.assets,
        files: this.files
      },
      this.fileDependencies
    );
  }

  /**
   * @description 编译模块，调用loader转换源码就是在这里做的
   * @param {*} name 模块所属的代码块(chunk)的名称，也就是entry的name entry1 entry2
   * @param {*} modulePath 模块的路径
   */
  buildModule(name, modulePath) {
    //1.读取文件的内容，得到源码
    let sourceCode = fs.readFileSync(modulePath, 'utf8');

    let { rules } = this.options.module;

    //根据规则找到所有的匹配的loader
    let loaders = [];
    rules.forEach(rule => {
      if (modulePath.match(rule.test)) {
        loaders.push(...rule.use);
      }
    });

    //调用所有配置的Loader对模块进行转换，得到转换后的代码
    sourceCode = loaders.reduceRight((sourceCode, loader) => {
      return require(loader)(sourceCode);
    }, sourceCode);

    //7.再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理

    //声明当前模块的ID
    let moduleId = './' + path.posix.relative(baseDir, modulePath);

    /**
     * 创建module对象
     * 模块ID就是相对于根目录的相对路径
     * dependencies就是此模块依赖的模块
     * name是模块所属的代码块的名称,如果一个模块属于多个代码块，那么name就是一个数组
     */
    let module = { id: moduleId, dependencies: [], names: [name] };

    // 根据源码创建AST
    let ast = parser.parse(sourceCode, { sourceType: 'module' });

    /**
     * 遍历AST，处理require语句，
     * 1、修改语法树，把依赖的模块名换成模块ID
     * 2、将所有require的模块ID（depModuleId）和模块路径放（depModulePath）
     *    放到 当前模块module的依赖数组中（dependencies）
     */
    traverse(ast, {
      // 找到require节点
      CallExpression: ({ node }) => {
        if (node.callee.name === 'require') {
          let depModuleName = node.arguments[0].value; //"./title"
          let depModulePath;

          if (depModuleName.startsWith('.')) {
            //暂时先不考虑node_modules里的模块，先只考虑相对路径
            const currentDir = path.posix.dirname(modulePath);
            //要找当前模块所有在的目录下面的相对路径
            depModulePath = path.posix.join(
              currentDir,
              depModuleName
            );
            //此绝对路径可能没有后续，需要尝试添加后缀
            const extensions = this.options.resolve.extensions;
            depModulePath = tryExtensions(depModulePath, extensions);
          } else {
            //如果不是以.开头的话，就是第三方模块
            depModulePath = require.resolve(depModuleName);
          }

          // 把依赖模块的路径放到维护所有依赖模块的 Set 中
          this.fileDependencies.add(depModulePath);

          //获取依赖的模块的ID,修改语法树，把依赖的模块名换成模块ID
          let depModuleId =
            './' + path.posix.relative(baseDir, depModulePath);
          node.arguments[0] = types.stringLiteral(depModuleId);

          //把依赖的块ID和依赖的模块路径放置到当前模块的依赖数组中
          module.dependencies.push({
            depModuleId,
            depModulePath
          });
        }
      }
    });

    //使用改造后的ast语法要地重新生成新的源代码
    let { code } = generator(ast);
    console.log('after ast transform', code);

    //将新的源代码添加到module上
    module._source = code;

    /**
     * 遍历当前模块的所有依赖模块
     * 1、若是依赖模块已经编译过了，则将当前模块的name添加到依赖模块的names数组中，表明此依赖模块是被当前模块依赖的
     * 2、若是依赖模块没有被编译过，则调用buildModule对此依赖模块进行编译
     */
    module.dependencies.forEach(({ depModuleId, depModulePath }) => {
      let existModule = this.modules.find(
        module => module.id === depModuleId
      );
      if (existModule) {
        existModule.names.push(name);
      } else {
        let depModule = this.buildModule(name, depModulePath);
        this.modules.push(depModule);
      }
    });
    return module;
  }
}

/**
 * @description 判断文件是否存在，可以给文件添加后缀进行查找
 */
function tryExtensions(modulePath, extensions) {
  if (fs.existsSync(modulePath)) {
    return modulePath;
  }
  for (let i = 0; i < extensions.length; i++) {
    let filePath = modulePath + extensions[i];
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  throw new Error(`找不到${modulePath}`);
}

/**
 * @description 根据chunk得到源码
 * chunk是和入口文件一一对应的
 */
function getSource(chunk) {
  return `
  (() => {
    var modules = {
      ${chunk.modules
        .map(
          module => `
          "${module.id}": module => {
            ${module._source}
          }
        `
        )
        .join(',')}
    };
    var cache = {};
    function require(moduleId) {
      var cachedModule = cache[moduleId];
      if (cachedModule !== undefined) {
        return cachedModule.exports;
      }
      var module = cache[moduleId] = {
        exports: {}
      };
      modules[moduleId](module, module.exports, require);
      return module.exports;
    }
    var exports = {};
    (() => {
      ${chunk.entryModule._source}
    })();
  })();
  `;
}
module.exports = Compilation;
