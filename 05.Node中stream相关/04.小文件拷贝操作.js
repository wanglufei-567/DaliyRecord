const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'test.txt');
const filePath2 = path.join(__dirname, 'test2.txt');

fs.readFile(filePath, 'utf-8', (err, data) => {
  console.log(data)
  fs.writeFile(filePath2, data, (err) => {
    const result = fs.readFileSync(filePath, 'utf-8');
    console.log(result)
  })
})
