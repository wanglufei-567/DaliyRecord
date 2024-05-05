//babel核心模块
const core = require('@babel/core');
//用来生成或者判断节点的AST语法树的节点
let types = require('@babel/types');
//let arrowFunctionPlugin = require('babel-plugin-transform-es2015-arrow-functions');

//实现一个转换箭头函数的插件
let arrowFunctionPlugin2 = {
  visitor: {
    // 处理箭头函数类型AST节点的方法
    ArrowFunctionExpression(path) {
      // 获取AST节点
      const { node } = path;
      // 修改该AST节点的类型为普通函数类型
      node.type = 'FunctionExpression';
      //指定this
      hoistFunctionEnvironment(path);
      const body = node.body;
      //判断body节点是不是块语句BlockStatement
      if (!types.isBlockStatement(body)) {
        //快速方便的构建节点
        node.body = types.blockStatement([
          types.returnStatement(body)
        ]);
      }
    }
  }
};

/**
 * 要在函数的外面声明一个_this变量，值是this
 * 在函数的内容，换this 变成_this
 * @param {*} path
 */
function hoistFunctionEnvironment(path) {
  //1.看看当前节点里有没有使用到this
  const thisPaths = getThisPaths(path);
  if (thisPaths.length > 0) {
    //可以用来生成_this变量的路径，找到最外层不是箭头函数的节点
    const thisEnv = path.findParent(parent => {
      //如果是函数，但不是箭头函数的话就返回true
      return (
        (parent.isFunction() && !parent.isArrowFunctionExpress()) ||
        parent.isProgram()
      );
    });
    let thisBindings = '_this';
    //如果此路径对应的作用域中没_this这个变量
    if (!thisEnv.scope.hasBinding(thisBindings)) {
      //向它对应的作用域里添加一个变量 ，变量名_this,变量的值this
      const thisIdentifier = types.identifier(thisBindings);
      // 创建一个变量'_this'为'this'
      thisEnv.scope.push({
        id: thisIdentifier,
        init: types.thisExpression()
      });
      // 替换箭头函数中所有'this'为'_this'
      thisPaths.forEach(thisPath => {
        thisPath.replaceWith(thisIdentifier);
      });
    }
  }
}

/**
 * 找到所有this的AST节点
 */
function getThisPaths(path) {
  let thisPaths = [];
  // 遍历此路径所有的子路径
  // traverse(visitor, state)
  path.traverse({
    // 处理this语句
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    }
  });
  return thisPaths;
}
//这是JS源代码，用字符串表示
const sourceCode = `
const sum = (a,b)=>{
  const minis = (a,b)=>{
    console.log(this);
    return a-b;
  }
  return a+b;
}
`;
const result = core.transform(sourceCode, {
  plugins: [arrowFunctionPlugin2]
});
console.log(result.code);

/**
var _this = this;
const sum = (a,b)=>{
   console.log(_this);
  return a+b;
}
 */
