const esprima = require('esprima'); //把JS源代码转成抽象语法树
const estraverse = require('estraverse'); //遍历抽象语法树
const escodegen = require('escodegen'); //把语法树重新生成源代码
// 源代码
const sourceCode = `function ast(){}`;
// 将源代码变成AST
const AST = esprima.parse(sourceCode);
// 遍历AST
estraverse.traverse(AST, {
  enter(node) {
    console.log('进入' + node.type);
    // 修改函数声明的函数名字
    if (node.type === 'FunctionDeclaration') {
      node.id.name = 'newAST';
    }
  },
  leave(node) {
    console.log('离开' + node.type);
  }
});
const result = escodegen.generate(AST);
console.log(result);
