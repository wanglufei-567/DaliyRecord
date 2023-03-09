const babel = require('@babel/core');
const sourceCode = `
<h1>
  hello<span style={{ color: 'red' }}>world</span>
</h1>
`;
const result = babel.transform(sourceCode, {
  plugins: [
    ["@babel/plugin-transform-react-jsx", { runtime: 'classic' }]
  ]
});
console.log(result.code);

// 打印结果
/*#__PURE__*/
// React.createElement("h1", null, "hello", /*#__PURE__*/React.createElement("span", {
//   style: {
//     color: 'red'
//   }
// }, "world"));