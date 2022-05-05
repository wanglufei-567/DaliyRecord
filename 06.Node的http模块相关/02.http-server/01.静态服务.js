// 静态服务
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const mime = require('mime');

// url 的组成 协议://（用户名：密码）域名：端口号/资源路径？查询参数#hash
// 'http://username:password@www.zf.cn:8080/xxx?a=1#hash'

// 通过url模块可以对url进行格式化
const { pathname, query } = url.parse(
  'http://username:password@www.zf.cn:8080/xxx?a=1#hash',
  true
);

const server = http.createServer((req, res) => {
  // 拿到资源路径
  const { pathname } = url.parse(req.url);

  // 根据路径来读取文件,这里的逻辑 一般使用异步操作来处理,若是同步的话，上一个请求还在处理的话，后面的请求都会阻断掉
  const filePath = path.join(__dirname, pathname);
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.statusCode = 404;
      return res.end('Not Found');
    }
    // mime.getType(filePath)是根据文件类型来设置头部的
    res.setHeader('Content-Type', mime.getType(filePath) + ';charset=utf8');
    res.end(data); // 将数据直接返回给浏览器
  });
});
server.listen(3000);
