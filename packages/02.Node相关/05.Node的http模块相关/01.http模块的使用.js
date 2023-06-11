const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  console.log('res', res);
  // console.log('req', req);
  const parseUrl = url.parse(req.url);
  console.log('parseUrl', parseUrl);

  /* -------------------------- req ---------------------------------- */
  // 通过post请求可以拿到data
  // curl -X POST --data a=1111 localhost:4000
  // req,res也是流
  req.on('data', data => {
    console.log('data', data);
  });
  req.on('end', () => {
    console.log('end');
  });

  /* -------------------------- res ---------------------------------- */
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello World');
  res.end();
});

server.listen(4000);
