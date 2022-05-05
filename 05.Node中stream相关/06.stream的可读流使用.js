const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'test.txt');
const rs = fs.createReadStream(filePath, {
  encoding: 'utf-8',
  // start: 0,
  // end: 4,
  highWaterMark: 2,
});
let str = '';

// rs.setEncoding('utf-8');

rs.on('open', (fd) => {
  console.log(fd)
})

rs.on('data', (chunk) => {
  rs.pause();
  str += chunk;
  console.log(chunk)
})

rs.on('end', () => {
  console.log('str', str)
})

setInterval(() => {
  rs.resume();
}, 1000);
