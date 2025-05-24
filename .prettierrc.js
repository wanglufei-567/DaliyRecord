module.exports = {
    printWidth: 100,
    // 打印宽度，默认是 80 列

    tabWidth: 2,
    // 缩进所占列数，默认是 2 列

    useTabs: false,
    // 缩进风格是否是Tab，默认是 false ，使用空格缩进

    semi: false,
    // 在语句末尾添加分号，默认是 true

    singleQuote: true,
    // 使用单引号，默认是 false

    quoteProps: "as-needed",
    // 对象中的属性使用引号，
    // "as-needed" 只对需要的属性加引号，
    // "consistent" 同一对象中属性引号保持统一，有福同享，有难同当
    // "preserve" 强制使用引号。
    // 默认为 as-needed

    jsxSingleQuotes: false, // JSX中使用单引号，默认是 false

    trailingComma: "es5",
    // 多行时是否结尾添加逗号
    // "es5" ES5中允许逗号的容器中添加逗号，比如 objects/arrays
    // "all" 尽可能添加逗号
    // "none" 不允许添加逗
    // 默认值是 "es5"

    bracketSpacing: true,
    // 是否保留对象内侧两端的空格，比如 { foo: bar } 和 {foo:bar} 的区别

    jsxBracketSameLine: false,
    // 多行 JSX 的元素是否能和属性同行，默认是 false

    arrowParens: "avoid",
    // 箭头函数参数使用圆括号包裹 比如 (x) => x 和 x => x 的区别
    // "always" 总是包裹
    // "avoid" 尽可能避免包裹

    rangeStart: 0,
    // 只格式化文件中的一部分，范围开始于第几行

    rangeEnd: Infinity,
    // 只格式化文件中的一部分，范围结束于第几行

    // parser: "none",
    // 指定解析器，Prettier会根据文件路径推断解析器
    // 比如 .js 文件使用 babel 解析，.scss 文件使用 post-scss 解析

    filepath: "none",
    // 指定用于推断使用那个解析器的文件名

    requirePragma: false,
    // 限制只格式化在文件顶部做了需格式化标识的文件
    // 适用于在大型未格式化项目中，先指定少量文件格式化

    insertPragma: false,

    proseWrap: "preserve",

    htmlWhitespaceSensitivity: "css",
    // HTML 文件的空格敏感度
    // "css" 和 css 的 display 属性保持一致
    // "strict" 空格敏感
    // "ignore" 空格不敏感

    vueIndentScriptAndStyle: false,
    // 是否对 Vue 文件中 <script> 和 <style> 标签内的代码应用缩进

    endOfLine: "lf",
    // 换行符

    embeddedLanguageFormatting: "auto"
    // 是否格式化嵌入引用代码，比如 markdown 文件中嵌入的代码块
    // "auto" Prettier 自动识别并格式化
    // "off" 关闭自动格式化
};

