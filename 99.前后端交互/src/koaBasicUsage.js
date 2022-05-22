const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const static = require('koa-static');

const app = new Koa();
const router = new Router();

// 解析body
app.use(
  koaBody({
    multipart: true, //解析多个文件
    formidable: {
      maxFileSize: 100 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
    }
  })
);
// 静态资源加载
app.use(static(__dirname + '/static'));

//路由前缀
router.prefix('/api');

/**
 * 预检请求配置CORS相关响应头
 */
router.options('/*', ctx => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Content-Length, Authorization, Accept, X-Requested-With'
  );
  ctx.set('Access-Control-Max-Age', 600);
  ctx.body = '';
});

router.get('/', ctx => {
  ctx.body = 'Hello';
});

router.get('/index', ctx => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.body = {
    status: 1,
    info: '请求成功'
  };
});

/**
 * 获取URL中的参数
 * http://localhost:4000/api/details:id?age=1&name=zhang
 */
router.get('/details:id', async ctx => {
  // /api/details:1?age=12&name=zhang
  console.log(ctx.url);
  // { age: '12', name: 'zhang' } 获取的是对象，用的最多的方式
  console.log(ctx.query);
  // age=12&name=zhang 获取的是字符串
  console.log(ctx.querystring);
  // { id: ':1' } 动态路由的传参
  console.log(ctx.params);
});

/**
 * 获取body中的参数
 * 需要借助koa-body中间件
 * 通过ctx.request.body获取
 * 不能使用ctx.body
 */
router.post('/post', ctx => {
  console.log(ctx.request.body);
  ctx.body = {
    status: 1,
    info: 'post请求成功'
  };
});

/**
 * 文件上传
 */
router.post('/upload', (ctx, next) => {
  console.log(ctx.request.body);
  console.log(ctx.request.files.img);
  let fileData = fs.readFileSync(ctx.request.files.img.path);
  fs.writeFileSync('static/imgs/' + ctx.request.files.img.name, fileData);
  ctx.body = '请求成功';
});

app.use(router.routes());
// 配置router.allowedMethods()可以自动设置响应头
app.use(router.allowedMethods());

app.listen(4000);
